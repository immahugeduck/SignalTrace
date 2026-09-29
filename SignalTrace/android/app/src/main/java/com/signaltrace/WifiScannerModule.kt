package com.signaltrace

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/** Port of net2ool WifiScanner via WifiManager.startScan(). */
class WifiScannerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun scanWifi(promise: Promise) {
        val context = reactApplicationContext
        if (!hasLocationPermission(context)) {
            promise.reject("PERMISSION_DENIED", "ACCESS_FINE_LOCATION is required to scan Wi-Fi")
            return
        }
        val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
        if (wifi == null) {
            promise.reject("NO_WIFI", "WifiManager unavailable")
            return
        }
        val requested = try {
            @Suppress("DEPRECATION")
            wifi.startScan()
        } catch (_: SecurityException) {
            false
        }
        if (!requested) {
            promise.resolve(readResults(wifi))
            return
        }
        val handler = Handler(Looper.getMainLooper())
        var settled = false
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                if (settled) return
                settled = true
                runCatching { context.unregisterReceiver(this) }
                handler.removeCallbacksAndMessages(null)
                promise.resolve(readResults(wifi))
            }
        }
        ContextCompat.registerReceiver(
            context,
            receiver,
            IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION),
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
        handler.postDelayed({
            if (settled) return@postDelayed
            settled = true
            runCatching { context.unregisterReceiver(receiver) }
            promise.resolve(readResults(wifi))
        }, SCAN_TIMEOUT_MS)
    }

    private fun readResults(wifi: WifiManager): WritableArray {
        val out = Arguments.createArray()
        val seen = HashSet<String>()
        try {
            for (result in wifi.scanResults) {
                val bssid = result.BSSID ?: continue
                if (!seen.add(bssid)) continue
                val ssid = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    result.wifiSsid?.toString()?.trim('"').orEmpty()
                } else {
                    @Suppress("DEPRECATION")
                    result.SSID.orEmpty()
                }
                val map: WritableMap = Arguments.createMap()
                map.putString("ssid", ssid.ifBlank { "(hidden)" })
                map.putString("bssid", bssid)
                map.putString("capabilities", result.capabilities ?: "")
                map.putInt("rssi", result.level)
                map.putInt("frequency", result.frequency)
                map.putString("band", bandForFrequency(result.frequency))
                map.putString("security", classifySecurity(result.capabilities ?: ""))
                out.pushMap(map)
            }
        } catch (_: SecurityException) { }
        return out
    }

    private fun bandForFrequency(freq: Int): String = when {
        freq in 2400..2500 -> "2.4 GHz"
        freq in 4900..5900 -> "5 GHz"
        freq in 5925..7125 -> "6 GHz"
        else -> "unknown"
    }

    private fun classifySecurity(capabilities: String): String {
        val caps = capabilities.uppercase()
        return when {
            caps.contains("WEP") || (caps.contains("TKIP") && !caps.contains("CCMP")) -> "weak"
            caps.contains("WPA3") || caps.contains("SAE") -> "wpa3"
            caps.contains("WPA2") || caps.contains("RSN") || caps.contains("CCMP") -> "wpa2"
            caps.contains("WPA") -> "wpa"
            caps.contains("ESS") && !caps.contains("WPA") && !caps.contains("RSN") -> "open"
            else -> "unknown"
        }
    }

    private fun hasLocationPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    companion object {
        const val NAME = "SignalTraceWifiScanner"
        const val SCAN_TIMEOUT_MS = 12_000L
    }
}
