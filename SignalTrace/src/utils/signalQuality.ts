import { CellReading, SignalQuality } from '@/types';
import { clamp } from '@/utils/math';

/**
 * Classifies serving-cell signal power into a human friendly quality level.
 *
 * LTE/NR expose RSRP (Reference Signal Received Power) which is the most
 * meaningful metric; older radios only report RSSI. Thresholds follow the
 * commonly used carrier ranges:
 *   RSRP  >= -80  excellent, -90 good, -100 fair, -110 poor, below very poor
 *   RSSI  >= -65  excellent, -75 good, -85 fair, -95 poor
 */
export function classifySignalQuality(reading: CellReading): SignalQuality {
  const rsrp = reading.rsrp;
  const rssi = reading.rssi;

  if (rsrp != null) {
    return fromThresholds(rsrp, [-80, -90, -100, -110]);
  }

  if (rssi != null) {
    return fromThresholds(rssi, [-65, -75, -85, -95]);
  }

  return { level: 'unknown', label: 'Unknown', bars: 0 };
}

function fromThresholds(
  value: number,
  [excellent, good, fair, poor]: [number, number, number, number],
): SignalQuality {
  if (value >= excellent) {
    return { level: 'excellent', label: 'Excellent', bars: 100 };
  }
  if (value >= good) {
    return { level: 'good', label: 'Good', bars: 80 };
  }
  if (value >= fair) {
    return { level: 'fair', label: 'Fair', bars: 55 };
  }
  if (value >= poor) {
    return { level: 'poor', label: 'Poor', bars: 30 };
  }
  // Linearly fade the bar between the poor threshold and a -140 dBm floor.
  const bars = clamp(Math.round(((value - -140) / (poor - -140)) * 30), 0, 30);
  return { level: 'poor', label: 'Very Poor', bars };
}
