package com.signaltrace

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Streams the device's compass heading (degrees clockwise from magnetic north)
 * to JavaScript as `SignalTraceHeading` events. Used by the Bluetooth radar to
 * estimate the bearing to a device while the user rotates/moves the phone.
 */
class OrientationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    private var sensorManager: SensorManager? = null
    private var rotationSensor: Sensor? = null
    private var listening = false

    private val rotationMatrix = FloatArray(9)
    private val orientation = FloatArray(3)

    override fun getName(): String = NAME

    @ReactMethod
    fun start(promise: Promise) {
        if (listening) {
            promise.resolve(true)
            return
        }
        val manager =
            reactApplicationContext.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        val sensor = manager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        if (manager == null || sensor == null) {
            promise.reject("NO_SENSOR", "Rotation vector sensor unavailable")
            return
        }
        sensorManager = manager
        rotationSensor = sensor
        manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
        listening = true
        promise.resolve(true)
    }

    @ReactMethod
    fun stop(promise: Promise) {
        sensorManager?.unregisterListener(this)
        listening = false
        promise.resolve(true)
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_ROTATION_VECTOR) {
            return
        }
        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
        SensorManager.getOrientation(rotationMatrix, orientation)
        // orientation[0] is azimuth in radians (-pi..pi); convert to 0..360.
        val degrees = ((Math.toDegrees(orientation[0].toDouble()) + 360.0) % 360.0)

        val map = Arguments.createMap()
        map.putDouble("heading", degrees)
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("SignalTraceHeading", map)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    @ReactMethod fun addListener(eventName: String) = Unit

    @ReactMethod fun removeListeners(count: Int) = Unit

    companion object {
        const val NAME = "SignalTraceOrientation"
    }
}
