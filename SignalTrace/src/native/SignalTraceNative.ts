import { NativeEventEmitter, NativeModules } from 'react-native';
import { AppTrafficSample, TrafficSample, WifiSecurity } from '@/types';

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
  getCellInfo(): Promise<NativeCellReading[]>;
}

export interface TrafficModule {
  getDeviceTraffic(): Promise<TrafficSample>;
  getAppTraffic(startMillis: number, endMillis: number): Promise<AppTrafficSample[]>;
  hasUsageAccess(): Promise<boolean>;
  requestUsageAccess(): Promise<void>;
}

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

export interface NativeWifiAp {
  ssid: string;
  bssid: string;
  capabilities: string;
  rssi: number;
  frequency: number;
  band: string;
  security: WifiSecurity;
}

export interface WifiScannerModule {
  scanWifi(): Promise<NativeWifiAp[]>;
}

interface NativeModuleRegistry {
  SignalTraceCellScanner?: CellScannerModule;
  SignalTraceTraffic?: TrafficModule;
  SignalTraceBleScanner?: BleScannerModule;
  SignalTraceOrientation?: OrientationModule;
  SignalTraceWifiScanner?: WifiScannerModule;
}

const modules = NativeModules as NativeModuleRegistry;

export const cellScannerModule: CellScannerModule | undefined =
  modules.SignalTraceCellScanner;

export const trafficModule: TrafficModule | undefined = modules.SignalTraceTraffic;

export const bleScannerModule: BleScannerModule | undefined = modules.SignalTraceBleScanner;

export const orientationModule: OrientationModule | undefined =
  modules.SignalTraceOrientation;

export const wifiScannerModule: WifiScannerModule | undefined =
  modules.SignalTraceWifiScanner;

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
