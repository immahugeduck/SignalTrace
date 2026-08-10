package com.signaltrace

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.CellInfo
import android.telephony.CellInfoCdma
import android.telephony.CellInfoGsm
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.CellInfoWcdma
import android.telephony.CellSignalStrengthNr
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/**
 * Exposes visible cell towers (serving + neighboring) from Android's
 * TelephonyManager to JavaScript. Values that a given radio does not report
 * are simply omitted from the returned map.
 */
class CellScannerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun getCellInfo(promise: Promise) {
        val context = reactApplicationContext
        if (!hasLocationPermission(context)) {
            promise.reject("PERMISSION_DENIED", "ACCESS_FINE_LOCATION is required to read cell info")
            return
        }

        val telephonyManager =
            context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        if (telephonyManager == null) {
            promise.reject("NO_TELEPHONY", "TelephonyManager unavailable on this device")
            return
        }

        try {
            val result = Arguments.createArray()
            val cellInfoList: List<CellInfo> = telephonyManager.allCellInfo ?: emptyList()
            val registeredCount = cellInfoList.count { it.isRegistered }

            for (info in cellInfoList) {
                val map = mapCellInfo(info) ?: continue
                map.putInt("neighboringCellCount", (registeredCount - 1).coerceAtLeast(0))
                result.pushMap(map)
            }
            promise.resolve(result)
        } catch (error: SecurityException) {
            promise.reject("PERMISSION_DENIED", error.message, error)
        } catch (error: Exception) {
            promise.reject("SCAN_FAILED", error.message, error)
        }
    }

    private fun mapCellInfo(info: CellInfo): WritableMap? {
        val map = Arguments.createMap()
        map.putBoolean("registered", info.isRegistered)

        when (info) {
            is CellInfoLte -> {
                map.putString("radioType", "LTE")
                val id = info.cellIdentity
                val signal = info.cellSignalStrength
                putIfValid(map, "mcc", id.mccString?.toIntOrNull())
                putIfValid(map, "mnc", id.mncString?.toIntOrNull())
                putIfValid(map, "tac", id.tac)
                putIfValid(map, "cid", id.ci)
                putIfValid(map, "pci", id.pci)
                putIfValid(map, "arfcn", id.earfcn)
                putIfValid(map, "rsrp", signal.rsrp)
                putIfValid(map, "rsrq", signal.rsrq)
                putIfValid(map, "rssi", signal.dbm)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    putIfValid(map, "sinr", signal.rssnr)
                }
            }

            is CellInfoWcdma -> {
                map.putString("radioType", "WCDMA")
                val id = info.cellIdentity
                putIfValid(map, "mcc", id.mccString?.toIntOrNull())
                putIfValid(map, "mnc", id.mncString?.toIntOrNull())
                putIfValid(map, "lac", id.lac)
                putIfValid(map, "cid", id.cid)
                putIfValid(map, "arfcn", id.uarfcn)
                putIfValid(map, "rssi", info.cellSignalStrength.dbm)
            }

            is CellInfoGsm -> {
                map.putString("radioType", "GSM")
                val id = info.cellIdentity
                putIfValid(map, "mcc", id.mccString?.toIntOrNull())
                putIfValid(map, "mnc", id.mncString?.toIntOrNull())
                putIfValid(map, "lac", id.lac)
                putIfValid(map, "cid", id.cid)
                putIfValid(map, "arfcn", id.arfcn)
                putIfValid(map, "rssi", info.cellSignalStrength.dbm)
            }

            is CellInfoCdma -> {
                map.putString("radioType", "CDMA")
                putIfValid(map, "rssi", info.cellSignalStrength.dbm)
            }

            else -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && info is CellInfoNr) {
                    map.putString("radioType", "NR")
                    val id = info.cellIdentity as? android.telephony.CellIdentityNr
                    val signal = info.cellSignalStrength as? CellSignalStrengthNr
                    if (id != null) {
                        putIfValid(map, "mcc", id.mccString?.toIntOrNull())
                        putIfValid(map, "mnc", id.mncString?.toIntOrNull())
                        putIfValid(map, "tac", id.tac)
                        putIfValid(map, "pci", id.pci)
                        putIfValid(map, "arfcn", id.nrarfcn)
                        // NCI (NR cell identity) is a long; downcast for JS number range.
                        if (id.nci != CellInfo.UNAVAILABLE_LONG) {
                            map.putDouble("cid", id.nci.toDouble())
                        }
                    }
                    if (signal != null) {
                        putIfValid(map, "rsrp", signal.ssRsrp)
                        putIfValid(map, "rsrq", signal.ssRsrq)
                        putIfValid(map, "sinr", signal.ssSinr)
                    }
                } else {
                    return null
                }
            }
        }

        return map
    }

    private fun putIfValid(map: WritableMap, key: String, value: Int?) {
        if (value != null && value != CellInfo.UNAVAILABLE && value != Int.MAX_VALUE) {
            map.putInt(key, value)
        }
    }

    private fun hasLocationPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    companion object {
        const val NAME = "SignalTraceCellScanner"
    }
}
