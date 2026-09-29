export type RadioType = 'GSM' | 'CDMA' | 'WCDMA' | 'LTE' | 'NR' | 'UNKNOWN';

export interface CellReading {
  timestamp: number;
  radioType: RadioType;
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
  latitude?: number;
  longitude?: number;
}

export interface TowerRecord {
  cid?: number;
  lac?: number;
  mcc?: number;
  mnc?: number;
  latitude: number;
  longitude: number;
  rangeMeters?: number;
  source: 'OpenCellID' | 'WiGLE' | 'Internal';
  firstSeenAt: number;
  lastSeenAt: number;
  confidence: number;
}

export interface GhostAssessment {
  score: number;
  isLikelyGhost: boolean;
  reasons: string[];
}

export interface ScanSnapshot {
  reading: CellReading;
  tower?: TowerRecord;
  ghostAssessment: GhostAssessment;
}

export type SignalQualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface SignalQuality {
  level: SignalQualityLevel;
  label: string;
  bars: number;
}

export interface TrafficSample {
  timestamp: number;
  rxBytes: number;
  txBytes: number;
}

export interface AppTrafficSample extends TrafficSample {
  uid: number;
  packageName?: string;
  appLabel?: string;
}

export interface TrafficSnapshot {
  timestamp: number;
  rxDeltaBytes: number;
  txDeltaBytes: number;
  rxBytesPerSecond: number;
  txBytesPerSecond: number;
  totalRxBytes: number;
  totalTxBytes: number;
}

export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface TrafficAnomaly {
  id: string;
  timestamp: number;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  packageName?: string;
  appLabel?: string;
}

export interface BleSignalSample {
  timestamp: number;
  rssi: number;
}

export type BleDeviceType = 'BR/EDR' | 'LE' | 'BR/EDR/LE' | 'UNKNOWN';

export interface BleDevice {
  address: string;
  name?: string;
  rssi: number;
  txPower?: number;
  type: BleDeviceType;
  bondState: string;
  connectable: boolean;
  manufacturerId?: number;
  manufacturerData?: string;
  firstSeenAt: number;
  lastSeenAt: number;
  distanceMeters: number;
  history: BleSignalSample[];
}

export interface BearingSample {
  heading: number;
  rssi: number;
  timestamp: number;
}

export interface BearingEstimate {
  bearing: number | null;
  confidence: number;
  distanceMeters: number;
  sampleCount: number;
}

export type WifiSecurity = 'open' | 'weak' | 'wpa' | 'wpa2' | 'wpa3' | 'unknown';

export interface WifiAccessPoint {
  ssid: string;
  bssid: string;
  bssidTail: string;
  capabilities: string;
  rssi: number;
  frequency: number;
  band: string;
  security: WifiSecurity;
}
