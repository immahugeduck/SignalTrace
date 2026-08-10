package com.signaltrace

import android.app.AppOpsManager
import android.app.usage.NetworkStats
import android.app.usage.NetworkStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.TrafficStats
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/**
 * Reports network byte counters to JavaScript.
 *
 *  - Device-wide totals come from [TrafficStats], which needs no special
 *    permission but only exposes aggregate rx/tx since boot.
 *  - Per-app breakdowns come from [NetworkStatsManager], which requires the
 *    PACKAGE_USAGE_STATS special access the user must grant in Settings.
 */
class TrafficModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun getDeviceTraffic(promise: Promise) {
        val rx = TrafficStats.getTotalRxBytes()
        val tx = TrafficStats.getTotalTxBytes()

        val map = Arguments.createMap()
        map.putDouble("timestamp", System.currentTimeMillis().toDouble())
        // TrafficStats.UNSUPPORTED (-1) is surfaced as-is; JS treats < 0 as unsupported.
        map.putDouble("rxBytes", rx.toDouble())
        map.putDouble("txBytes", tx.toDouble())
        promise.resolve(map)
    }

    @ReactMethod
    fun hasUsageAccess(promise: Promise) {
        promise.resolve(hasUsageStatsPermission())
    }

    @ReactMethod
    fun requestUsageAccess(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("SETTINGS_UNAVAILABLE", error.message, error)
        }
    }

    @ReactMethod
    fun getAppTraffic(startMillis: Double, endMillis: Double, promise: Promise) {
        if (!hasUsageStatsPermission()) {
            promise.resolve(Arguments.createArray())
            return
        }

        val context = reactApplicationContext
        val statsManager =
            context.getSystemService(Context.NETWORK_STATS_SERVICE) as? NetworkStatsManager
        if (statsManager == null) {
            promise.resolve(Arguments.createArray())
            return
        }

        try {
            val result = Arguments.createArray()
            // Aggregate mobile + wifi per uid over the requested window.
            collectByUid(statsManager, ConnectivityManager.TYPE_MOBILE, startMillis.toLong(), endMillis.toLong(), result, context)
            collectByUid(statsManager, ConnectivityManager.TYPE_WIFI, startMillis.toLong(), endMillis.toLong(), result, context)
            promise.resolve(result)
        } catch (error: SecurityException) {
            promise.reject("PERMISSION_DENIED", error.message, error)
        } catch (error: Exception) {
            promise.reject("QUERY_FAILED", error.message, error)
        }
    }

    private fun collectByUid(
        statsManager: NetworkStatsManager,
        networkType: Int,
        start: Long,
        end: Long,
        out: WritableArray,
        context: Context,
    ) {
        val stats: NetworkStats =
            statsManager.querySummary(networkType, null, start, end) ?: return
        val bucket = NetworkStats.Bucket()
        // Accumulate per uid because a uid appears once per state/tag bucket.
        val perUid = HashMap<Int, LongArray>() // uid -> [rx, tx]

        while (stats.hasNextBucket()) {
            stats.getNextBucket(bucket)
            val entry = perUid.getOrPut(bucket.uid) { LongArray(2) }
            entry[0] += bucket.rxBytes
            entry[1] += bucket.txBytes
        }
        stats.close()

        val now = System.currentTimeMillis().toDouble()
        for ((uid, bytes) in perUid) {
            if (bytes[0] == 0L && bytes[1] == 0L) {
                continue
            }
            val map: WritableMap = Arguments.createMap()
            map.putInt("uid", uid)
            map.putDouble("rxBytes", bytes[0].toDouble())
            map.putDouble("txBytes", bytes[1].toDouble())
            map.putDouble("timestamp", now)
            resolvePackage(context, uid)?.let { (pkg, label) ->
                map.putString("packageName", pkg)
                map.putString("appLabel", label)
            }
            out.pushMap(map)
        }
    }

    private fun resolvePackage(context: Context, uid: Int): Pair<String, String>? {
        val pm = context.packageManager
        val packages = pm.getPackagesForUid(uid) ?: return null
        val pkg = packages.firstOrNull() ?: return null
        return try {
            val info: ApplicationInfo = pm.getApplicationInfo(pkg, 0)
            pkg to pm.getApplicationLabel(info).toString()
        } catch (error: PackageManager.NameNotFoundException) {
            pkg to pkg
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val context = reactApplicationContext
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
            ?: return false
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName,
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName,
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    companion object {
        const val NAME = "SignalTraceTraffic"
    }
}
