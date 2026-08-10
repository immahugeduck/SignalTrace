import NetInfo from '@react-native-community/netinfo';
import { CellReading, RadioType } from '@/types';
import { NativeCellReading, cellScannerModule } from '@/native/SignalTraceNative';

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

function mapNativeReading(item: NativeCellReading): CellReading {
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
  if (!cellScannerModule) {
    // Native module not present (e.g. running under Metro without the Android
    // build, or in tests). Callers fall back to NetInfo-derived context.
    return [];
  }

  try {
    const current = await cellScannerModule.getCellInfo();
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

  // Fallback path provides minimal live context until the native cellular
  // module is available. It cannot report tower IDs or power, so ghost
  // detection is effectively disabled for these readings.
  const networkState = await NetInfo.fetch();
  const fallback: CellReading = {
    timestamp: Date.now(),
    radioType: networkState.type === 'cellular' ? 'LTE' : 'UNKNOWN',
  };

  return [fallback];
}
