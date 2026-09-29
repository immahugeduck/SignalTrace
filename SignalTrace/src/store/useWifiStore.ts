import { create } from 'zustand';
import { wifiScannerModule } from '@/native/SignalTraceNative';
import { WifiAccessPoint } from '@/types';

function tail(bssid: string): string {
  const parts = bssid.split(':');
  return parts.slice(-2).join(':').toLowerCase();
}

interface WifiState {
  accessPoints: WifiAccessPoint[];
  scanning: boolean;
  error?: string;
  lastScanAt?: number;
  scan: () => Promise<void>;
}

export const useWifiStore = create<WifiState>((set) => ({
  accessPoints: [],
  scanning: false,
  scan: async () => {
    if (!wifiScannerModule) {
      set({ error: 'Wi-Fi scanner native module is not in this build.' });
      return;
    }
    set({ scanning: true, error: undefined });
    try {
      const raw = await wifiScannerModule.scanWifi();
      const accessPoints: WifiAccessPoint[] = raw.map((ap) => ({
        ssid: ap.ssid,
        bssid: ap.bssid,
        bssidTail: tail(ap.bssid),
        capabilities: ap.capabilities,
        rssi: ap.rssi,
        frequency: ap.frequency,
        band: ap.band,
        security: ap.security,
      }));
      accessPoints.sort((a, b) => b.rssi - a.rssi);
      set({ accessPoints, scanning: false, lastScanAt: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wi-Fi scan failed';
      set({ scanning: false, error: message });
    }
  },
}));
