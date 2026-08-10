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
  /** 0-100 human friendly bar value derived from RSRP/RSSI. */
  bars: number;
}

/**
 * A single cumulative byte counter reading for the whole device or a single
 * app (uid). Counters are monotonic since boot, so deltas between samples are
 * what actually describe live throughput.
 */
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

/**
 * Rates and totals computed from two consecutive {@link TrafficSample}s.
 */
export interface TrafficSnapshot {
  timestamp: number;
  /** Bytes received since the previous sample. */
  rxDeltaBytes: number;
  /** Bytes transmitted since the previous sample. */
  txDeltaBytes: number;
  /** Download rate in bytes/second over the sampling window. */
  rxBytesPerSecond: number;
  /** Upload rate in bytes/second over the sampling window. */
  txBytesPerSecond: number;
  /** Cumulative totals since monitoring started. */
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
  /** Optional offending app, when the anomaly is attributable to one uid. */
  packageName?: string;
  appLabel?: string;
}

/** A single RSSI reading for a Bluetooth device at a point in time. */
export interface BleSignalSample {
  timestamp: number;
  rssi: number;
}

export type BleDeviceType = 'BR/EDR' | 'LE' | 'BR/EDR/LE' | 'UNKNOWN';

/**
 * A nearby Bluetooth device, accumulated from the live advertisement stream.
 * `rssi` is the latest reading; `history` is a bounded rolling window used for
 * the signal-strength chart.
 */
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
  /** Estimated distance in metres from the RSSI path-loss model. */
  distanceMeters: number;
  history: BleSignalSample[];
}

/** One (heading, rssi) observation captured while direction-finding. */
export interface BearingSample {
  heading: number;
  rssi: number;
  timestamp: number;
}

/** Result of estimating which direction a device is in from bearing samples. */
export interface BearingEstimate {
  /** Best-guess bearing in degrees (0-360, clockwise from north), or null. */
  bearing: number | null;
  /** 0-1 confidence based on sample spread and signal contrast. */
  confidence: number;
  distanceMeters: number;
  sampleCount: number;
}
