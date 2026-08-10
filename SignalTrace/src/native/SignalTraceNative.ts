import { NativeEventEmitter, NativeModules } from 'react-native';
import { AppTrafficSample, TrafficSample } from '@/types';

/**
 * Typed access to the SignalTrace native Android modules. Both modules are
 * implemented in Kotlin under android/app/src/main/java/com/signaltrace and
 * registered by SignalTracePackage. When the JS runs outside a build that
 * includes the native side (e.g. Metro on a plain device, or unit tests), the
 * modules are `undefined`; every consumer must guard for that and fall back.
 */

export interface NativeCellReading {
  radioType?: string;
  registered?: boolean;
  mcc?: number;
  mnc?: number;
  lac?: number;
  tac?: number;
  cid?: number;
  pci?: number;
  arfcn?: number;
  rsrp?: number;
  rsrq?: number;
  rssi?: number;
  sinr?: number;
  neighboringCellCount?: number;
}

export interface CellScannerModule {
  /** Returns all visible cells (serving + neighboring) from TelephonyManager. */
  getCellInfo(): Promise<NativeCellReading[]>;
}

export interface TrafficModule {
  /** Device-wide cumulative rx/tx byte counters since boot (TrafficStats). */
  getDeviceTraffic(): Promise<TrafficSample>;
  /**
   * Per-app cumulative traffic over [start, end] using NetworkStatsManager.
   * Requires PACKAGE_USAGE_STATS special access; resolves to [] otherwise.
   */
  getAppTraffic(startMillis: number, endMillis: number): Promise<AppTrafficSample[]>;
  /** Whether PACKAGE_USAGE_STATS has been granted for this app. */
  hasUsageAccess(): Promise<boolean>;
  /** Opens the system Usage Access settings screen so the user can grant it. */
  requestUsageAccess(): Promise<void>;
}

/** Raw BLE advertisement payload emitted by the native scanner. */
export interface NativeBleDevice {
  address: string;
  name?: string;
  rssi: number;
  txPower?: number;
  timestamp: number;
  type?: string;
  bondState?: string;
  connectable?: boolean;
  manufacturerId?: number;
  manufacturerData?: string;
}

export interface BleScannerModule {
  isSupported(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  startScan(): Promise<boolean>;
  stopScan(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export interface OrientationModule {
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

interface NativeModuleRegistry {
  SignalTraceCellScanner?: CellScannerModule;
  SignalTraceTraffic?: TrafficModule;
  SignalTraceBleScanner?: BleScannerModule;
  SignalTraceOrientation?: OrientationModule;
}

const modules = NativeModules as NativeModuleRegistry;

export const cellScannerModule: CellScannerModule | undefined =
  modules.SignalTraceCellScanner;

export const trafficModule: TrafficModule | undefined = modules.SignalTraceTraffic;

export const bleScannerModule: BleScannerModule | undefined = modules.SignalTraceBleScanner;

export const orientationModule: OrientationModule | undefined =
  modules.SignalTraceOrientation;

/** Native event names emitted through RCTDeviceEventEmitter. */
export const BLE_DEVICE_EVENT = 'SignalTraceBleDevice';
export const BLE_SCAN_FAILED_EVENT = 'SignalTraceBleScanFailed';
export const HEADING_EVENT = 'SignalTraceHeading';

export function createBleEmitter(): NativeEventEmitter | undefined {
  if (!bleScannerModule) {
    return undefined;
  }
  return new NativeEventEmitter(bleScannerModule as unknown as never);
}

export function createOrientationEmitter(): NativeEventEmitter | undefined {
  if (!orientationModule) {
    return undefined;
  }
  return new NativeEventEmitter(orientationModule as unknown as never);
}
