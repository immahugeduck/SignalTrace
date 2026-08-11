import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BleSignalSample } from '@/types';
import { clamp } from '@/utils/math';

interface BleSignalChartProps {
  history: BleSignalSample[];
  /** Number of most-recent samples to render. */
  window?: number;
}

const TOP_DBM = 0;
const BOTTOM_DBM = -100;
const GRID = [0, -25, -50, -75, -100];

function toFraction(rssi: number): number {
  return clamp((rssi - BOTTOM_DBM) / (TOP_DBM - BOTTOM_DBM), 0, 1);
}

/**
 * Lightweight, dependency-free signal-strength-over-time chart. Each sample is
 * a vertical bar whose height maps RSSI (0 dBm at top, -100 at bottom), giving
 * the filled-area look of the reference screenshots without a charting library.
 */
export function BleSignalChart({ history, window = 60 }: BleSignalChartProps): React.JSX.Element {
  const samples = history.slice(-window);
  const latest = samples.length > 0 ? samples[samples.length - 1].rssi : undefined;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.current}>{latest != null ? `${latest} dBm` : '—'}</Text>
      <View style={styles.plotRow}>
        <View style={styles.axis}>
          {GRID.map((value) => (
            <Text key={value} style={styles.axisLabel}>
              {value}
            </Text>
          ))}
        </View>

        <View style={styles.plot}>
          {GRID.map((value) => (
            <View
              key={value}
              style={[styles.gridLine, { bottom: `${toFraction(value) * 100}%` }]}
            />
          ))}

          <View style={styles.bars}>
            {samples.map((sample, index) => (
              <View key={`${sample.timestamp}-${index}`} style={styles.barColumn}>
                <View style={[styles.bar, { height: `${toFraction(sample.rssi) * 100}%` }]} />
              </View>
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.caption}>
        Not real-time precise — reflects the Bluetooth scan refresh rate.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  current: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  plotRow: {
    flexDirection: 'row',
    height: 160,
  },
  axis: {
    width: 34,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  axisLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  plot: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: 1,
    borderColor: '#1f2937',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1f2937',
  },
  bars: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#2dd4bf',
    width: '100%',
    minHeight: 1,
  },
  caption: {
    color: '#64748b',
    fontSize: 11,
  },
});
