import { appConfig } from '@/config';
import { CellReading, TowerRecord } from '@/types';

interface WigleResult {
  lat?: number;
  trilat?: number;
  lon?: number;
  trilong?: number;
}

interface WiglePayload {
  success?: boolean;
  results?: WigleResult[];
}

export async function fetchTowerFromWigle(
  reading: CellReading,
): Promise<TowerRecord | undefined> {
  if (!appConfig.wigleApiToken) {
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
    netid: String(reading.mcc),
    operator: String(reading.mnc),
    cid: String(reading.cid),
    location: `${lac}`,
  });

  const response = await fetch(
    `https://api.wigle.net/api/v2/cell/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Basic ${appConfig.wigleApiToken}`,
      },
    },
  );

  if (!response.ok) {
    return undefined;
  }

  const payload = (await response.json()) as WiglePayload;
  const top = payload.results?.[0];
  const lat = top?.lat ?? top?.trilat;
  const lon = top?.lon ?? top?.trilong;

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return undefined;
  }

  const now = Date.now();
  return {
    cid: reading.cid,
    lac,
    mcc: reading.mcc,
    mnc: reading.mnc,
    latitude: lat,
    longitude: lon,
    source: 'WiGLE',
    firstSeenAt: now,
    lastSeenAt: now,
    confidence: 0.75,
  };
}
