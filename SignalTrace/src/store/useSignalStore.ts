import { create } from 'zustand';
import { ScanSnapshot } from '@/types';
import { assessGhostTower } from '@/services/ghostDetector';
import { resolveTower } from '@/services/towerResolver';
import { scanCellReadings } from '@/services/deviceScanner';

interface SignalStoreState {
  snapshots: ScanSnapshot[];
  isScanning: boolean;
  lastError?: string;
  startScan: () => Promise<void>;
  stopScan: () => void;
}

let scanTimer: ReturnType<typeof setInterval> | undefined;

export const useSignalStore = create<SignalStoreState>((set, get) => {
  async function scanOnce(): Promise<void> {
    try {
      const currentReadings = await scanCellReadings();

      const enriched = await Promise.all(
        currentReadings.map(async (reading) => {
          const tower = await resolveTower(reading);
          const history = get().snapshots.map((item) => item.reading);
          const ghostAssessment = assessGhostTower(reading, history, tower);
          return {
            reading,
            tower,
            ghostAssessment,
          };
        }),
      );

      set((state) => ({
        snapshots: [...state.snapshots, ...enriched].slice(-250),
        lastError: undefined,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan signal data.';
      set({ lastError: message });
    }
  }

  return {
    snapshots: [],
    isScanning: false,
    lastError: undefined,
    startScan: async () => {
      if (get().isScanning) {
        return;
      }

      set({ isScanning: true });
      await scanOnce();
      scanTimer = setInterval(scanOnce, 5000);
    },
    stopScan: () => {
      if (scanTimer) {
        clearInterval(scanTimer);
        scanTimer = undefined;
      }
      set({ isScanning: false });
    },
  };
});
