import { BleDevice, BleDeviceType, BleSignalSample } from '@/types';
import { NativeBleDevice } from '@/native/SignalTraceNative';
import { rssiToDistanceMeters } from '@/utils/distance';

const MAX_HISTORY = 90;

function parseType(value?: string): BleDeviceType {
  switch (value) {
    case 'BR/EDR':
    case 'LE':
    case 'BR/EDR/LE':
      return value;
    default:
      return 'UNKNOWN';
  }
}

/**
 * Folds a freshly received advertisement into the existing device record (or
 * creates one), appending to the bounded RSSI history and recomputing the
 * distance estimate. Pure: returns a new object, never mutates `existing`.
 */
export function mergeAdvertisement(
  existing: BleDevice | undefined,
  raw: NativeBleDevice,
): BleDevice {
  const sample: BleSignalSample = { timestamp: raw.timestamp, rssi: raw.rssi };
  const history = [...(existing?.history ?? []), sample].slice(-MAX_HISTORY);

  return {
    address: raw.address,
    // Keep a previously learned name if this advertisement omitted it.
    name: raw.name ?? existing?.name,
    rssi: raw.rssi,
    txPower: raw.txPower ?? existing?.txPower,
    type: parseType(raw.type),
    bondState: raw.bondState ?? existing?.bondState ?? 'Unbound',
    connectable: raw.connectable ?? existing?.connectable ?? true,
    manufacturerId: raw.manufacturerId ?? existing?.manufacturerId,
    manufacturerData: raw.manufacturerData ?? existing?.manufacturerData,
    firstSeenAt: existing?.firstSeenAt ?? raw.timestamp,
    lastSeenAt: raw.timestamp,
    distanceMeters: rssiToDistanceMeters(raw.rssi, raw.txPower ?? existing?.txPower),
    history,
  };
}

/** Sorts devices strongest-signal-first for the nearby list. */
export function sortByStrength(devices: BleDevice[]): BleDevice[] {
  return [...devices].sort((a, b) => b.rssi - a.rssi);
}

/** Drops devices not seen within `staleMs` so the live list self-prunes. */
export function pruneStale(devices: BleDevice[], now: number, staleMs: number): BleDevice[] {
  return devices.filter((device) => now - device.lastSeenAt <= staleMs);
}
