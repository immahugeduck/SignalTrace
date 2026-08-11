import { BearingEstimate, BearingSample } from '@/types';
import { rssiToDistanceMeters } from '@/utils/distance';
import { clamp } from '@/utils/math';

const MIN_SAMPLES = 8;
const BUCKET_DEGREES = 15;

/**
 * Estimates the bearing to a Bluetooth device from a set of (heading, rssi)
 * samples gathered while the user slowly rotates/sweeps the phone.
 *
 * Intuition: signal is strongest when the phone's back is pointed at (or the
 * body is not blocking) the device. We bucket samples by heading, average RSSI
 * per bucket, and take the strongest bucket as the bearing. Confidence grows
 * with the RSSI contrast between the best and worst directions and with how
 * many directions were actually sampled.
 *
 * This is deliberately heuristic — RSSI direction-finding on a single antenna
 * is approximate — and mirrors the "sampling data, please move your device"
 * radar UX rather than promising true angle-of-arrival.
 */
export function estimateBearing(samples: BearingSample[]): BearingEstimate {
  const latestRssi = samples.length > 0 ? samples[samples.length - 1].rssi : -100;
  const distanceMeters = rssiToDistanceMeters(latestRssi);

  if (samples.length < MIN_SAMPLES) {
    return {
      bearing: null,
      confidence: 0,
      distanceMeters,
      sampleCount: samples.length,
    };
  }

  const bucketCount = Math.ceil(360 / BUCKET_DEGREES);
  const sums = new Array<number>(bucketCount).fill(0);
  const counts = new Array<number>(bucketCount).fill(0);

  for (const sample of samples) {
    const normalized = ((sample.heading % 360) + 360) % 360;
    const bucket = Math.floor(normalized / BUCKET_DEGREES) % bucketCount;
    sums[bucket] += sample.rssi;
    counts[bucket] += 1;
  }

  let bestBucket = -1;
  let bestAvg = -Infinity;
  let worstAvg = Infinity;
  let populatedBuckets = 0;

  for (let i = 0; i < bucketCount; i += 1) {
    if (counts[i] === 0) {
      continue;
    }
    populatedBuckets += 1;
    const avg = sums[i] / counts[i];
    if (avg > bestAvg) {
      bestAvg = avg;
      bestBucket = i;
    }
    if (avg < worstAvg) {
      worstAvg = avg;
    }
  }

  if (bestBucket < 0) {
    return { bearing: null, confidence: 0, distanceMeters, sampleCount: samples.length };
  }

  const bearing = bestBucket * BUCKET_DEGREES + BUCKET_DEGREES / 2;

  // Contrast: a >= 20 dB spread across directions is a strong directional cue.
  const contrast = clamp((bestAvg - worstAvg) / 20, 0, 1);
  // Coverage: reward sampling many distinct directions (up to ~2/3 of buckets).
  const coverage = clamp(populatedBuckets / (bucketCount * 0.66), 0, 1);
  const confidence = Math.round(contrast * coverage * 100) / 100;

  return {
    bearing,
    confidence,
    distanceMeters,
    sampleCount: samples.length,
  };
}
