import NetInfo from '@react-native-community/netinfo';
import { CellReading, RadioType } from '@/types';

interface NativeCellInfo {
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
  radioType?: string;
}

function parseRadioType(value?: string): RadioType {
  switch (value?.toUpperCase()) {
    case 'GSM':
    case 'CDMA':
    case 'WCDMA':
    case 'LTE':
    case 'NR':
      return value.toUpperCase() as RadioType;
    default:
      return 'UNKNOWN';
  }
}

function mapNativeReading(item: NativeCellInfo): CellReading {
  return {
    timestamp: Date.now(),
    radioType: parseRadioType(item.radioType),
    mcc: item.mcc,
    mnc: item.mnc,
    lac: item.lac,
    tac: item.tac,
    cid: item.cid,
    pci: item.pci,
    arfcn: item.arfcn,
    rsrp: item.rsrp,
    rsrq: item.rsrq,
    rssi: item.rssi,
    sinr: item.sinr,
    neighboringCellCount: item.neighboringCellCount,
  };
}

async function readFromNativeModule(): Promise<CellReading[]> {
  try {
    // This keeps the app buildable even before installing a TelephonyManager bridge.
    const cellularInfo = require('react-native-cellular-info');
    const current = (await cellularInfo.getCellInfo()) as NativeCellInfo[];
    return current.map(mapNativeReading);
  } catch {
    return [];
  }
}

export async function scanCellReadings(): Promise<CellReading[]> {
  const readings = await readFromNativeModule();
  if (readings.length > 0) {
    return readings;
  }

  // Fallback path provides minimal live context until native cellular plugin is connected.
  const networkState = await NetInfo.fetch();
  const fallback: CellReading = {
    timestamp: Date.now(),
    radioType: 'UNKNOWN',
    rsrp: undefined,
    rsrq: undefined,
    rssi: undefined,
    sinr: undefined,
  };

  if (networkState.type === 'cellular') {
    fallback.radioType = 'LTE';
  }

  return [fallback];
}
