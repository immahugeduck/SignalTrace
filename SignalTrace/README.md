# SignalTrace

An Android cellular **signal detector and analyzer** built with React Native. It
helps you understand what your phone's radio is doing, spot suspicious cell
towers (including IMSI‑catcher / "ghost" tower patterns), and watch the data
flowing in and out of your device for unusual activity.

> **Scope & ethics.** SignalTrace is a defensive, on‑device analysis tool. It
> reads your own phone's telephony and network‑usage state through standard
> Android APIs. It does not transmit, jam, decode, or intercept anyone else's
> traffic. The tower‑ and traffic‑based indicators below are *heuristics* — they
> flag patterns worth a closer look, not proof of an attack.

## Core features

### 1. Cell tower discovery & location
- Reads all visible cells (serving + neighboring) from `TelephonyManager`
  (`CellScannerModule`): radio type, MCC/MNC, LAC/TAC, CID/PCI, ARFCN and signal
  metrics (RSRP/RSRQ/RSSI/SINR).
- Resolves tower coordinates via **OpenCellID** and **WiGLE** and plots them on a
  map (`TowerMap`).

### 2. Real‑time signal strength & connection
- Live per‑scan snapshot with a signal‑quality classification
  (`classifySignalQuality`) and a strength bar (`SignalSummaryCard`).
- Rolling history of recent cells (`TowerList`).

### 3. Ghost / temporary (IMSI‑catcher) tower detection
`ghostDetector` scores each reading against several rogue‑base‑station
indicators:
- Tower ID absent from trusted datasets (OpenCellID/WiGLE).
- Implausibly abrupt signal‑power jumps.
- Rapid cell‑ID churn.
- Strong serving signal with no neighboring cells.
- Same CID appearing under a **different operator (MNC)** — spoofing indicator.
- Unexpected **downgrade to 2G/GSM** after LTE/5G — classic downgrade attack.

### 4. Data‑traffic monitoring & anomaly alerts
- Device‑wide upload/download rates and session totals from `TrafficStats`
  (`TrafficModule` → `DataUsageCard`).
- Optional **per‑app** attribution via `NetworkStatsManager` (requires the
  user‑granted *Usage Access* special permission).
- `anomalyDetector` raises alerts for sustained high uploads, large single‑window
  uploads, and outbound‑heavy (exfiltration‑like) ratios, per‑device and per‑app
  (`DataAnomalyList`).

### 5. Live Bluetooth tracking (Bluetooth tab)
- **`BleScannerModule`** streams every BLE advertisement (address, name, RSSI,
  TX power, type, bond state, manufacturer data) into a live **nearby‑devices
  list** with a *Real‑time data* toggle (`BleDeviceList`).
- Per‑device **signal‑strength‑over‑time chart** (`BleSignalChart`) and an
  **RSSI→distance** estimate via a log‑distance path‑loss model
  (`rssiToDistanceMeters`).
- **Direction‑finding radar** (`BleRadar`): using the rotation‑vector sensor
  (`OrientationModule`) it collects `(heading, rssi)` samples as you move and
  estimates the bearing to the device (`bearingEstimator`) — an AR‑relative
  compass where turning the phone toward the device brings the blip to the top.
  RSSI direction‑finding on one antenna is approximate, so a confidence score is
  shown alongside.

## Architecture

```
App.tsx                          Cellular / Bluetooth tab shell
├── components/CellularScreen.tsx cellular dashboard
├── components/BluetoothScreen.tsx Bluetooth dashboard (list + detail + radar)
├── store/useSignalStore.ts       cell scanning loop + ghost scoring
├── store/useTrafficStore.ts      traffic sampling loop + anomaly detection
├── store/useBleStore.ts          BLE scan stream + realtime toggle + radar
├── services/
│   ├── deviceScanner.ts          native cell bridge (+ NetInfo fallback)
│   ├── ghostDetector.ts          rogue‑tower heuristics
│   ├── towerResolver.ts          OpenCellID → WiGLE lookup
│   ├── trafficMonitor.ts         TrafficStats / NetworkStats bridge + math
│   ├── anomalyDetector.ts        unusual‑traffic heuristics
│   ├── bleTracker.ts             advertisement → BleDevice folding
│   └── bearingEstimator.ts       (heading, rssi) → bearing estimate
├── native/SignalTraceNative.ts   typed access to the native modules + events
└── android/.../com/signaltrace   Kotlin native modules (see below)
```

The JavaScript layer degrades gracefully when the native modules aren't present
(e.g. Metro without a native build, or unit tests): cell scanning falls back to
`NetInfo` context, and traffic/Bluetooth report "unsupported".

### Native modules (Kotlin)
- `CellScannerModule` (`SignalTraceCellScanner`) — `getCellInfo()`.
- `TrafficModule` (`SignalTraceTraffic`) — `getDeviceTraffic()`,
  `getAppTraffic(start, end)`, `hasUsageAccess()`, `requestUsageAccess()`.
- `BleScannerModule` (`SignalTraceBleScanner`) — `startScan()`/`stopScan()`,
  emits `SignalTraceBleDevice` events.
- `OrientationModule` (`SignalTraceOrientation`) — `start()`/`stop()`, emits
  `SignalTraceHeading` events from the rotation‑vector sensor.
- Registered by `SignalTracePackage`.

## Permissions
Requested at runtime:
- Cellular (`ensureAndroidSignalPermissions`): `ACCESS_FINE_LOCATION`,
  `ACCESS_COARSE_LOCATION`, `READ_PHONE_STATE` — fine location is required by
  `getAllCellInfo()` to return tower identities.
- Bluetooth (`ensureBluetoothPermissions`): `BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT`
  on Android 12+, falling back to `ACCESS_FINE_LOCATION` on older releases.

Declared in the manifest / granted via Settings: `INTERNET`,
`ACCESS_NETWORK_STATE`, and the special‑access `PACKAGE_USAGE_STATS` (tap
**Grant Usage Access** in the Data Monitor card to enable per‑app monitoring).

## Getting started

```bash
cd SignalTrace
npm install
cp .env.example .env      # add OpenCellID / WiGLE keys for tower geolocation
npm run typecheck         # tsc --noEmit
npm run android           # build & run on a device/emulator
```

Environment variables (via `react-native-config`, see `.env.example`):
`OPENCELLID_API_KEY`, `WIGLE_API_TOKEN` (base64 `username:token`),
`SIGNALTRACE_API_BASE_URL` (optional).

### Notes on the Android project
The `android/` folder follows the React Native 0.76 template and includes the
Gradle 8.10.2 wrapper. `react-native-maps` needs a Google Maps API key in the
manifest to render the map on device.

## Deployment

SignalTrace is a native Android app, not a web service — it must be built
with Gradle and uploaded as an APK/AAB. **Do not use Cloud Build's
"Buildpacks" / "Deploy to Cloud Run" flow from console.cloud.google.com**;
that flow containerizes web apps and has nothing to build here (it's what
causes stray "missing Ruby" style failures — it's trying to detect a web
runtime that doesn't exist in this repo).

To build a release bundle:

```bash
cd android
./gradlew bundleRelease \
  -PMAPS_API_KEY=... \
  -PRELEASE_STORE_FILE=/path/to/release.keystore \
  -PRELEASE_STORE_PASSWORD=... \
  -PRELEASE_KEY_ALIAS=... \
  -PRELEASE_KEY_PASSWORD=...
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`, ready to
upload to the Play Console. Without the `RELEASE_*` properties, `release`
builds fall back to the checked-in debug keystore (fine for local testing,
**not** accepted by Play Store).

The repo's [`cloudbuild.yaml`](../cloudbuild.yaml) runs this same Gradle build
in Cloud Build if you want CI to produce the `.aab` artifact for you.
