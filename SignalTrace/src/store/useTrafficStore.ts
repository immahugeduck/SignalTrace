import { create } from 'zustand';
import { TrafficAnomaly, TrafficSample, TrafficSnapshot } from '@/types';
import {
  computeTrafficSnapshot,
  hasUsageAccess,
  requestUsageAccess,
  sampleAppTraffic,
  sampleDeviceTraffic,
} from '@/services/trafficMonitor';
import { detectAppAnomalies, detectDeviceAnomalies } from '@/services/anomalyDetector';

const SAMPLE_INTERVAL_MS = 3000;
const MAX_SNAPSHOTS = 120;
const MAX_ANOMALIES = 50;

interface TrafficStoreState {
  snapshots: TrafficSnapshot[];
  anomalies: TrafficAnomaly[];
  latest?: TrafficSnapshot;
  isMonitoring: boolean;
  usageAccessGranted: boolean;
  supported: boolean;
  lastError?: string;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  refreshUsageAccess: () => Promise<void>;
  openUsageAccessSettings: () => Promise<void>;
}

let monitorTimer: ReturnType<typeof setInterval> | undefined;

export const useTrafficStore = create<TrafficStoreState>((set, get) => {
  let previousSample: TrafficSample | undefined;
  let baseline: { rx: number; tx: number } | undefined;
  let windowStart = Date.now();

  function pushAnomalies(next: TrafficAnomaly[]): void {
    if (next.length === 0) {
      return;
    }
    set((state) => ({
      anomalies: [...next, ...state.anomalies].slice(0, MAX_ANOMALIES),
    }));
  }

  async function sampleOnce(): Promise<void> {
    try {
      const current = await sampleDeviceTraffic();
      if (!current) {
        set({ supported: false });
        return;
      }

      if (!baseline) {
        baseline = { rx: current.rxBytes, tx: current.txBytes };
      }

      if (previousSample) {
        const snapshot = computeTrafficSnapshot(previousSample, current, baseline);
        set((state) => ({
          snapshots: [...state.snapshots, snapshot].slice(-MAX_SNAPSHOTS),
          latest: snapshot,
          supported: true,
          lastError: undefined,
        }));

        pushAnomalies(detectDeviceAnomalies(snapshot));

        // Attribute anomalies to apps over the elapsed window when we have
        // usage-access permission. This is best-effort and silently no-ops
        // otherwise.
        if (get().usageAccessGranted) {
          const apps = await sampleAppTraffic(windowStart, current.timestamp);
          pushAnomalies(detectAppAnomalies(apps));
        }
      }

      previousSample = current;
      windowStart = current.timestamp;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sample network traffic.';
      set({ lastError: message });
    }
  }

  return {
    snapshots: [],
    anomalies: [],
    latest: undefined,
    isMonitoring: false,
    usageAccessGranted: false,
    supported: true,
    lastError: undefined,
    startMonitoring: async () => {
      if (get().isMonitoring) {
        return;
      }
      set({ isMonitoring: true });
      set({ usageAccessGranted: await hasUsageAccess() });
      previousSample = undefined;
      baseline = undefined;
      windowStart = Date.now();
      await sampleOnce();
      monitorTimer = setInterval(sampleOnce, SAMPLE_INTERVAL_MS);
    },
    stopMonitoring: () => {
      if (monitorTimer) {
        clearInterval(monitorTimer);
        monitorTimer = undefined;
      }
      set({ isMonitoring: false });
    },
    refreshUsageAccess: async () => {
      set({ usageAccessGranted: await hasUsageAccess() });
    },
    openUsageAccessSettings: async () => {
      await requestUsageAccess();
    },
  };
});
