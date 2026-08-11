import { clamp } from '@/utils/math';

/**
 * Reference RSSI (dBm) measured at 1 metre for a typical BLE radio when the
 * advertisement does not carry a calibrated TX power. Real beacons vary; this
 * is a reasonable default for phones/earbuds.
 */
const DEFAULT_RSSI_AT_ONE_METER = -59;

/**
 * Environmental path-loss exponent. 2.0 = free space; 2.7-3.5 indoors with
 * walls/bodies. 2.5 is a decent all-round compromise for the "distance" readout.
 */
const PATH_LOSS_EXPONENT = 2.5;

/**
 * Estimates distance in metres from RSSI using the log-distance path-loss model:
 *
 *   distance = 10 ^ ((referenceRssi - rssi) / (10 * n))
 *
 * When the advertisement includes a calibrated `txPower` (RSSI at 1 m) we use
 * it; otherwise we fall back to {@link DEFAULT_RSSI_AT_ONE_METER}.
 *
 * The result is a coarse estimate — RSSI is noisy and multipath-prone — so it
 * is clamped to a sane range and rounded to a friendly precision.
 */
export function rssiToDistanceMeters(rssi: number, txPower?: number): number {
  if (!Number.isFinite(rssi) || rssi === 0) {
    return 0;
  }

  const referenceRssi = txPower != null && txPower < 0 ? txPower : DEFAULT_RSSI_AT_ONE_METER;
  const ratio = (referenceRssi - rssi) / (10 * PATH_LOSS_EXPONENT);
  const distance = Math.pow(10, ratio);

  const bounded = clamp(distance, 0, 200);
  return Math.round(bounded * 100) / 100;
}
