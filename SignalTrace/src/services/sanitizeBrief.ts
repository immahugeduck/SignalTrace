import { BleDevice, CellReading, TrafficAnomaly, WifiAccessPoint } from '@/types';

export interface SanitizedBriefPayload {
  generatedAt: number;
  cells: { count: number; radios: string[]; ghostFlagCount: number; strongestRsrp?: number };
  wifi: {
    apCount: number;
    bands: string[];
    securityCounts: Record<string, number>;
    hiddenCount: number;
    duplicateSsidGroups: number;
  };
  bluetooth: { deviceCount: number; namedCount: number };
  traffic: { anomalyCount: number; severities: string[] };
}

export function sanitizeBriefInput(input: {
  cells: CellReading[];
  ghostFlagCount: number;
  wifi: WifiAccessPoint[];
  ble: BleDevice[];
  anomalies: TrafficAnomaly[];
}): SanitizedBriefPayload {
  const securityCounts: Record<string, number> = {};
  for (const ap of input.wifi) {
    securityCounts[ap.security] = (securityCounts[ap.security] ?? 0) + 1;
  }
  const ssidCounts = new Map<string, number>();
  for (const ap of input.wifi) {
    if (ap.ssid === '(hidden)') continue;
    ssidCounts.set(ap.ssid, (ssidCounts.get(ap.ssid) ?? 0) + 1);
  }
  const rsrps = input.cells.map((c) => c.rsrp).filter((n): n is number => typeof n === 'number');
  return {
    generatedAt: Date.now(),
    cells: {
      count: input.cells.length,
      radios: [...new Set(input.cells.map((c) => c.radioType))],
      ghostFlagCount: input.ghostFlagCount,
      strongestRsrp: rsrps.length ? Math.max(...rsrps) : undefined,
    },
    wifi: {
      apCount: input.wifi.length,
      bands: [...new Set(input.wifi.map((a) => a.band))],
      securityCounts,
      hiddenCount: input.wifi.filter((a) => a.ssid === '(hidden)').length,
      duplicateSsidGroups: [...ssidCounts.values()].filter((n) => n > 1).length,
    },
    bluetooth: {
      deviceCount: input.ble.length,
      namedCount: input.ble.filter((d) => Boolean(d.name)).length,
    },
    traffic: {
      anomalyCount: input.anomalies.length,
      severities: [...new Set(input.anomalies.map((a) => a.severity))],
    },
  };
}

export function localBrief(payload: SanitizedBriefPayload): string {
  return [
    'On-device brief (no raw identifiers left this phone).',
    `Cells: ${payload.cells.count} visible, radios ${payload.cells.radios.join(', ') || 'none'}.`,
    payload.cells.ghostFlagCount
      ? `Ghost heuristics flagged ${payload.cells.ghostFlagCount} reading(s). That is a lead, not proof of a stingray.`
      : 'No ghost-tower heuristic flags in the current window.',
    `Wi-Fi: ${payload.wifi.apCount} APs. Security mix: ${JSON.stringify(payload.wifi.securityCounts)}.`,
    payload.wifi.securityCounts.open || payload.wifi.securityCounts.weak
      ? 'Open or weak encryption APs are present. Prefer WPA2/WPA3 for anything you join.'
      : 'No open/WEP/TKIP APs in this sweep.',
    payload.wifi.duplicateSsidGroups
      ? `${payload.wifi.duplicateSsidGroups} SSID name(s) appeared on more than one BSSID. Could be mesh, extender, or a lookalike network.`
      : 'No duplicate SSID groups in this sweep.',
    `Bluetooth: ${payload.bluetooth.deviceCount} advertisements (${payload.bluetooth.namedCount} named).`,
    `Traffic anomalies: ${payload.traffic.anomalyCount}.`,
    'Next checks: Location On before Wi-Fi/cell scans; ignore one-off RSSI jumps; do not treat BLE names as identity.',
  ].join('\n');
}
