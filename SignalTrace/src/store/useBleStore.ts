import { EmitterSubscription } from 'react-native';
import { create } from 'zustand';
import { BearingEstimate, BearingSample, BleDevice } from '@/types';
import {
  BLE_DEVICE_EVENT,
  BLE_SCAN_FAILED_EVENT,
  HEADING_EVENT,
  NativeBleDevice,
  bleScannerModule,
  createBleEmitter,
  createOrientationEmitter,
  orientationModule,
} from '@/native/SignalTraceNative';
import { mergeAdvertisement, pruneStale, sortByStrength } from '@/services/bleTracker';
import { estimateBearing } from '@/services/bearingEstimator';

const STALE_MS = 15000;
const PRUNE_INTERVAL_MS = 3000;
const MAX_BEARING_SAMPLES = 240;

interface BleStoreState {
  devices: BleDevice[];
  isScanning: boolean;
  realtime: boolean;
  supported: boolean;
  lastError?: string;

  selectedAddress?: string;

  /** Radar direction-finding state. */
  samplingAddress?: string;
  heading: number;
  bearingSamples: BearingSample[];
  bearingEstimate: BearingEstimate;

  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  setRealtime: (value: boolean) => void;
  selectDevice: (address?: string) => void;
  startBearingSampling: (address: string) => Promise<void>;
  stopBearingSampling: () => Promise<void>;
}

const EMPTY_ESTIMATE: BearingEstimate = {
  bearing: null,
  confidence: 0,
  distanceMeters: 0,
  sampleCount: 0,
};

let deviceSub: EmitterSubscription | undefined;
let failSub: EmitterSubscription | undefined;
let headingSub: EmitterSubscription | undefined;
let pruneTimer: ReturnType<typeof setInterval> | undefined;

export const useBleStore = create<BleStoreState>((set, get) => {
  function onDevice(raw: NativeBleDevice): void {
    // When live updates are paused, freeze the list (but still feed the radar
    // if a direction-finding session is active for this device).
    const state = get();
    const isSampling = state.samplingAddress === raw.address;

    if (state.realtime) {
      const others = state.devices.filter((device) => device.address !== raw.address);
      const existing = state.devices.find((device) => device.address === raw.address);
      const merged = mergeAdvertisement(existing, raw);
      set({ devices: sortByStrength([...others, merged]) });
    }

    if (isSampling) {
      const sample: BearingSample = {
        heading: get().heading,
        rssi: raw.rssi,
        timestamp: raw.timestamp,
      };
      const bearingSamples = [...get().bearingSamples, sample].slice(-MAX_BEARING_SAMPLES);
      set({ bearingSamples, bearingEstimate: estimateBearing(bearingSamples) });
    }
  }

  return {
    devices: [],
    isScanning: false,
    realtime: true,
    supported: true,
    lastError: undefined,
    selectedAddress: undefined,
    samplingAddress: undefined,
    heading: 0,
    bearingSamples: [],
    bearingEstimate: EMPTY_ESTIMATE,

    startScan: async () => {
      if (get().isScanning) {
        return;
      }
      if (!bleScannerModule) {
        set({ supported: false, lastError: 'Bluetooth scanning is unavailable in this build.' });
        return;
      }

      try {
        const supported = await bleScannerModule.isSupported();
        if (!supported) {
          set({ supported: false, lastError: 'This device has no Bluetooth LE hardware.' });
          return;
        }

        const emitter = createBleEmitter();
        deviceSub = emitter?.addListener(BLE_DEVICE_EVENT, onDevice);
        failSub = emitter?.addListener(BLE_SCAN_FAILED_EVENT, (payload: { errorCode: number }) => {
          set({ lastError: `Bluetooth scan failed (code ${payload.errorCode}).` });
        });

        await bleScannerModule.startScan();
        set({ isScanning: true, supported: true, lastError: undefined });

        pruneTimer = setInterval(() => {
          set((s) => ({ devices: pruneStale(s.devices, Date.now(), STALE_MS) }));
        }, PRUNE_INTERVAL_MS);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start Bluetooth scan.';
        set({ lastError: message });
      }
    },

    stopScan: async () => {
      deviceSub?.remove();
      failSub?.remove();
      deviceSub = undefined;
      failSub = undefined;
      if (pruneTimer) {
        clearInterval(pruneTimer);
        pruneTimer = undefined;
      }
      await get().stopBearingSampling();
      try {
        await bleScannerModule?.stopScan();
      } catch {
        // Best-effort; the subscription is already gone.
      }
      set({ isScanning: false });
    },

    setRealtime: (value: boolean) => set({ realtime: value }),

    selectDevice: (address?: string) => set({ selectedAddress: address }),

    startBearingSampling: async (address: string) => {
      set({
        samplingAddress: address,
        bearingSamples: [],
        bearingEstimate: EMPTY_ESTIMATE,
      });
      if (orientationModule) {
        const emitter = createOrientationEmitter();
        headingSub = emitter?.addListener(HEADING_EVENT, (payload: { heading: number }) => {
          set({ heading: payload.heading });
        });
        try {
          await orientationModule.start();
        } catch {
          // Heading sensor is optional; the radar still shows signal/distance.
        }
      }
    },

    stopBearingSampling: async () => {
      headingSub?.remove();
      headingSub = undefined;
      try {
        await orientationModule?.stop();
      } catch {
        // ignore
      }
      set({ samplingAddress: undefined });
    },
  };
});
