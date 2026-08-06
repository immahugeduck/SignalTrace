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
