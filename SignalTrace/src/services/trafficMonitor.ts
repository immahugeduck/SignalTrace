import { AppTrafficSample, TrafficSample, TrafficSnapshot } from '@/types';
import { trafficModule } from '@/native/SignalTraceNative';

/**
 * Reads cumulative device-wide byte counters. Uses the native TrafficStats
 * bridge when available; otherwise returns undefined so the caller can degrade
 * gracefully (JS has no access to raw interface counters on Android).
 */
export async function sampleDeviceTraffic(): Promise<TrafficSample | undefined> {
  if (!trafficModule) {
    return undefined;
  }

  try {
    const sample = await trafficModule.getDeviceTraffic();
    // TrafficStats returns -1 (UNSUPPORTED) on some devices/counters.
    if (sample.rxBytes < 0 || sample.txBytes < 0) {
      return undefined;
    }
    return sample;
  } catch {
    return undefined;
  }
}

/**
 * Reads per-app traffic for a time window. Requires PACKAGE_USAGE_STATS special
 * access; resolves to an empty list when unavailable or ungranted.
 */
export async function sampleAppTraffic(
  startMillis: number,
  endMillis: number,
): Promise<AppTrafficSample[]> {
  if (!trafficModule) {
    return [];
  }

  try {
    if (!(await trafficModule.hasUsageAccess())) {
      return [];
    }
    return await trafficModule.getAppTraffic(startMillis, endMillis);
  } catch {
    return [];
  }
}

export async function hasUsageAccess(): Promise<boolean> {
  if (!trafficModule) {
    return false;
  }
  try {
    return await trafficModule.hasUsageAccess();
  } catch {
    return false;
  }
}

export async function requestUsageAccess(): Promise<void> {
  if (!trafficModule) {
    return;
  }
  try {
    await trafficModule.requestUsageAccess();
  } catch {
    // Opening Settings is best-effort; ignore failures.
  }
}

/**
 * Computes throughput and deltas between two cumulative samples. Handles the
 * counter reset that happens on reboot (current < previous) by treating the
 * window as if it started at the current values, avoiding negative rates.
 */
export function computeTrafficSnapshot(
  previous: TrafficSample,
  current: TrafficSample,
  baseline: { rx: number; tx: number },
): TrafficSnapshot {
  const elapsedMs = current.timestamp - previous.timestamp;
  const elapsedSeconds = elapsedMs > 0 ? elapsedMs / 1000 : 1;

  const counterReset = current.rxBytes < previous.rxBytes || current.txBytes < previous.txBytes;
  const rxDelta = counterReset ? 0 : current.rxBytes - previous.rxBytes;
  const txDelta = counterReset ? 0 : current.txBytes - previous.txBytes;

  return {
    timestamp: current.timestamp,
    rxDeltaBytes: rxDelta,
    txDeltaBytes: txDelta,
    rxBytesPerSecond: Math.max(0, Math.round(rxDelta / elapsedSeconds)),
    txBytesPerSecond: Math.max(0, Math.round(txDelta / elapsedSeconds)),
    totalRxBytes: Math.max(0, current.rxBytes - baseline.rx),
    totalTxBytes: Math.max(0, current.txBytes - baseline.tx),
  };
}
