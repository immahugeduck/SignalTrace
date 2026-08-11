package com.signaltrace

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Continuously scans for nearby Bluetooth LE devices and streams each
 * advertisement to JavaScript as a `SignalTraceBleDevice` event. Consumers
 * build the live nearby-devices list, per-device RSSI history, and
 * RSSI-derived distance from the stream.
 */
class BleScannerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var scanner: BluetoothLeScanner? = null
    private var scanning = false

    private val scanCallback =
        object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult) {
                emitDevice(result)
            }

            override fun onBatchScanResults(results: MutableList<ScanResult>) {
                results.forEach { emitDevice(it) }
            }

            override fun onScanFailed(errorCode: Int) {
                val map = Arguments.createMap()
                map.putInt("errorCode", errorCode)
                emit("SignalTraceBleScanFailed", map)
            }
        }

    override fun getName(): String = NAME

    @ReactMethod
    fun isSupported(promise: Promise) {
        val adapter = adapter()
        promise.resolve(adapter != null && reactApplicationContext.packageManager
            .hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE))
    }

    @ReactMethod
    fun isEnabled(promise: Promise) {
        promise.resolve(adapter()?.isEnabled == true)
    }

    @ReactMethod
    fun startScan(promise: Promise) {
        if (scanning) {
            promise.resolve(true)
            return
        }
        if (!hasScanPermission()) {
            promise.reject("PERMISSION_DENIED", "BLUETOOTH_SCAN / location permission required")
            return
        }
        val adapter = adapter()
        if (adapter == null || !adapter.isEnabled) {
            promise.reject("BT_DISABLED", "Bluetooth is off or unavailable")
            return
        }

        scanner = adapter.bluetoothLeScanner
        if (scanner == null) {
            promise.reject("NO_SCANNER", "BluetoothLeScanner unavailable")
            return
        }

        val settings =
            ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build()

        try {
            scanner?.startScan(null, settings, scanCallback)
            scanning = true
            promise.resolve(true)
        } catch (error: SecurityException) {
            promise.reject("PERMISSION_DENIED", error.message, error)
        } catch (error: Exception) {
            promise.reject("SCAN_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        try {
            if (scanning && hasScanPermission()) {
                scanner?.stopScan(scanCallback)
            }
        } catch (error: SecurityException) {
            // Losing the permission mid-scan is non-fatal; just fall through.
        } finally {
            scanning = false
            promise.resolve(true)
        }
    }

    private fun emitDevice(result: ScanResult) {
        val device = result.device
        val map = Arguments.createMap()
        map.putString("address", device.address)
        map.putString("name", safeDeviceName(device, result))
        map.putInt("rssi", result.rssi)
        map.putDouble("timestamp", System.currentTimeMillis().toDouble())

        val txPower = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            result.txPower
        } else {
            ScanResult.TX_POWER_NOT_PRESENT
        }
        if (txPower != ScanResult.TX_POWER_NOT_PRESENT) {
            map.putInt("txPower", txPower)
        }

        map.putString("type", deviceType(device))
        map.putString("bondState", bondState(device))
        map.putBoolean("connectable", isConnectable(result))

        result.scanRecord?.let { record ->
            val manufacturer = record.manufacturerSpecificData
            if (manufacturer != null && manufacturer.size() > 0) {
                val id = manufacturer.keyAt(0)
                map.putInt("manufacturerId", id)
                map.putString("manufacturerData", manufacturer.valueAt(0)?.toHex())
            }
        }

        emit("SignalTraceBleDevice", map)
    }

    private fun safeDeviceName(device: BluetoothDevice, result: ScanResult): String? =
        try {
            device.name ?: result.scanRecord?.deviceName
        } catch (error: SecurityException) {
            result.scanRecord?.deviceName
        }

    private fun deviceType(device: BluetoothDevice): String =
        try {
            when (device.type) {
                BluetoothDevice.DEVICE_TYPE_CLASSIC -> "BR/EDR"
                BluetoothDevice.DEVICE_TYPE_LE -> "LE"
                BluetoothDevice.DEVICE_TYPE_DUAL -> "BR/EDR/LE"
                else -> "UNKNOWN"
            }
        } catch (error: SecurityException) {
            "UNKNOWN"
        }

    private fun bondState(device: BluetoothDevice): String =
        try {
            when (device.bondState) {
                BluetoothDevice.BOND_BONDED -> "Bound"
                BluetoothDevice.BOND_BONDING -> "Bonding"
                else -> "Unbound"
            }
        } catch (error: SecurityException) {
            "Unbound"
        }

    private fun isConnectable(result: ScanResult): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) result.isConnectable else true

    private fun emit(event: String, payload: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, payload)
    }

    private fun adapter(): BluetoothAdapter? {
        val manager =
            reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE)
                as? BluetoothManager
        return manager?.adapter
    }

    private fun hasScanPermission(): Boolean {
        val context = reactApplicationContext
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            granted(context, Manifest.permission.BLUETOOTH_SCAN)
        } else {
            granted(context, Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    private fun granted(context: Context, permission: String): Boolean =
        ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED

    // Required so NativeEventEmitter works without warnings on the JS side.
    @ReactMethod fun addListener(eventName: String) = Unit

    @ReactMethod fun removeListeners(count: Int) = Unit

    companion object {
        const val NAME = "SignalTraceBleScanner"

        private fun ByteArray.toHex(): String =
            joinToString(" ") { byte -> "0x%02X".format(byte) }
    }
}
