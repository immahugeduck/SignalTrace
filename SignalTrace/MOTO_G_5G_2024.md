# Moto G 5G 2024 (XT2417) — run SignalTrace

Android 14 (API 34). Repo already uses compileSdk 35, targetSdk 34, minSdk 24, NDK 27.1. No Motorola vendor SDK.

## Phone
1. About phone → tap Build number 7 times.
2. Developer options: USB debugging On.
3. Plug USB, accept RSA prompt.
4. Location On (Precise). Empty Wi-Fi/cell lists usually mean Location is off.
5. Grant Location + Phone. Nearby Wi-Fi Devices if prompted.

## Computer
```bash
cd SignalTrace
npm install
cp .env.example .env
adb devices
npm run android
```

SDK Manager if Gradle asks: Platform 35, Build-Tools 35.0.0, NDK 27.1.12297006, CMake 3.22.1.

Sideload: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`

This model is Wi-Fi 5 (2.4/5 GHz only). startScan is throttled ~4 times / 2 minutes.
