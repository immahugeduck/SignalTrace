import { NativeModules } from 'react-native';
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

interface NativeModuleRegistry {
  SignalTraceCellScanner?: CellScannerModule;
  SignalTraceTraffic?: TrafficModule;
}

const modules = NativeModules as NativeModuleRegistry;

export const cellScannerModule: CellScannerModule | undefined =
  modules.SignalTraceCellScanner;

export const trafficModule: TrafficModule | undefined = modules.SignalTraceTraffic;
