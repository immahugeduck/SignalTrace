import { appConfig } from '@/config';
import { CellReading, TowerRecord } from '@/types';

interface OpenCellIdResponse {
  lat?: number;
  lon?: number;
  range?: number;
}

export async function fetchTowerFromOpenCellId(
  reading: CellReading,
): Promise<TowerRecord | undefined> {
  if (!appConfig.openCellIdApiKey) {
    return undefined;
  }

  if (!reading.mcc || !reading.mnc || !reading.cid) {
    return undefined;
  }

  const lac = reading.lac ?? reading.tac;
  if (!lac) {
    return undefined;
  }

  const params = new URLSearchParams({
    key: appConfig.openCellIdApiKey,
    mcc: String(reading.mcc),
    mnc: String(reading.mnc),
    lac: String(lac),
    cellid: String(reading.cid),
    format: 'json',
  });

  const response = await fetch(`https://opencellid.org/cell/get?${params.toString()}`);
  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as OpenCellIdResponse;
  if (typeof payload.lat !== 'number' || typeof payload.lon !== 'number') {
    return undefined;
  }

  const now = Date.now();
  return {
    cid: reading.cid,
    lac,
    mcc: reading.mcc,
    mnc: reading.mnc,
    latitude: payload.lat,
    longitude: payload.lon,
    rangeMeters: payload.range,
    source: 'OpenCellID',
    firstSeenAt: now,
    lastSeenAt: now,
    confidence: 0.85,
  };
}
