import { AppTrafficSample, TrafficAnomaly, TrafficSnapshot } from '@/types';
import { formatBytes, formatRate } from '@/utils/format';

export interface AnomalyThresholds {
  /** Upload rate (bytes/s) above which a sustained burst is flagged. */
  uploadRateBytesPerSecond: number;
  /**
   * Ratio of upload to download over a window above which traffic is
   * considered exfiltration-like (phones normally download far more than they
   * upload).
   */
  uploadDownloadRatio: number;
  /** Per-window transmit volume (bytes) that is notable on its own. */
  largeUploadBytes: number;
}

export const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  uploadRateBytesPerSecond: 512 * 1024, // 512 KB/s sustained upload
  uploadDownloadRatio: 3,
  largeUploadBytes: 5 * 1024 * 1024, // 5 MB in a single sampling window
};

/**
 * Evaluates a single traffic snapshot for device-wide anomalies. Anomalies are
 * heuristic signals of "unusual" outbound activity, not proof of compromise.
 */
export function detectDeviceAnomalies(
  snapshot: TrafficSnapshot,
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS,
): TrafficAnomaly[] {
  const anomalies: TrafficAnomaly[] = [];

  if (snapshot.txBytesPerSecond >= thresholds.uploadRateBytesPerSecond) {
    anomalies.push({
      id: `upload-rate-${snapshot.timestamp}`,
      timestamp: snapshot.timestamp,
      severity: 'warning',
      title: 'High sustained upload rate',
      detail: `Uploading at ${formatRate(snapshot.txBytesPerSecond)}, above the ${formatRate(
        thresholds.uploadRateBytesPerSecond,
      )} threshold.`,
    });
  }

  if (snapshot.txDeltaBytes >= thresholds.largeUploadBytes) {
    anomalies.push({
      id: `upload-volume-${snapshot.timestamp}`,
      timestamp: snapshot.timestamp,
      severity: 'warning',
      title: 'Large data upload',
      detail: `${formatBytes(snapshot.txDeltaBytes)} sent in a single interval.`,
    });
  }

  // Only judge the ratio once there is meaningful traffic, otherwise idle
  // keep-alives produce noise.
  const meaningfulTraffic = snapshot.txDeltaBytes > 256 * 1024;
  if (
    meaningfulTraffic &&
    snapshot.txDeltaBytes > snapshot.rxDeltaBytes * thresholds.uploadDownloadRatio
  ) {
    anomalies.push({
      id: `upload-ratio-${snapshot.timestamp}`,
      timestamp: snapshot.timestamp,
      severity: 'critical',
      title: 'Outbound-heavy traffic',
      detail: `Sent ${formatBytes(snapshot.txDeltaBytes)} vs received ${formatBytes(
        snapshot.rxDeltaBytes,
      )} — unusual for normal usage and consistent with data exfiltration.`,
    });
  }

  return anomalies;
}

/**
 * Flags individual apps whose upload volume over the window is dominant or
 * outbound-heavy. Helps attribute a device-wide anomaly to a specific app.
 */
export function detectAppAnomalies(
  deltas: AppTrafficSample[],
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS,
): TrafficAnomaly[] {
  const anomalies: TrafficAnomaly[] = [];

  for (const app of deltas) {
    const outboundHeavy =
      app.txBytes > 256 * 1024 && app.txBytes > app.rxBytes * thresholds.uploadDownloadRatio;
    const largeUpload = app.txBytes >= thresholds.largeUploadBytes;

    if (!outboundHeavy && !largeUpload) {
      continue;
    }

    const name = app.appLabel ?? app.packageName ?? `uid ${app.uid}`;
    anomalies.push({
      id: `app-${app.uid}-${app.timestamp}`,
      timestamp: app.timestamp,
      severity: largeUpload && outboundHeavy ? 'critical' : 'warning',
      title: `Unusual activity: ${name}`,
      detail: `Sent ${formatBytes(app.txBytes)} / received ${formatBytes(app.rxBytes)}.`,
      packageName: app.packageName,
      appLabel: app.appLabel,
    });
  }

  return anomalies;
}
