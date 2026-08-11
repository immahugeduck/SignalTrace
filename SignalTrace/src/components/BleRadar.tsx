import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BearingEstimate } from '@/types';
import { clamp } from '@/utils/math';

interface BleRadarProps {
  deviceLabel: string;
  rssi?: number;
  heading: number;
  estimate: BearingEstimate;
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RING_INSET = 18;
const RADIUS = CENTER - RING_INSET;
const MAX_DISTANCE_M = 40;

/** Polar (degrees clockwise from top) → absolute {left, top} for a dot. */
function polarToOffset(angleDeg: number, radius: number, dotSize: number): { left: number; top: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.sin(rad) * radius;
  const y = -Math.cos(rad) * radius;
  return { left: CENTER + x - dotSize / 2, top: CENTER + y - dotSize / 2 };
}

/**
 * AR-relative direction finder. The device blip is drawn at (bearing − heading)
 * so that rotating the phone to face the device brings the blip to the top;
 * distance drives how far from centre it sits. A north tick shows where
 * magnetic north is as you turn.
 */
export function BleRadar({ deviceLabel, rssi, heading, estimate }: BleRadarProps): React.JSX.Element {
  const northOffset = polarToOffset(-heading, RADIUS, 14);

  const hasBearing = estimate.bearing != null;
  const screenAngle = hasBearing ? (estimate.bearing as number) - heading : 0;
  const distanceRadius = clamp(estimate.distanceMeters / MAX_DISTANCE_M, 0.12, 1) * RADIUS;
  const blipOffset = polarToOffset(screenAngle, distanceRadius, 22);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{deviceLabel}</Text>
      <Text style={styles.subtitle}>
        {hasBearing ? 'Rotate toward the blip to home in' : 'Sampling data, please move your device…'}
      </Text>

      <View style={styles.radar}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringMid]} />
        <View style={[styles.ring, styles.ringInner]} />
        <View style={styles.crosshairV} />
        <View style={styles.crosshairH} />

        {/* You (phone) at centre, front-of-phone points up. */}
        <View style={styles.self} />

        {/* North reference tick. */}
        <View style={[styles.north, { left: northOffset.left, top: northOffset.top }]}>
          <Text style={styles.northText}>N</Text>
        </View>

        {hasBearing ? (
          <View
            style={[
              styles.blip,
              { left: blipOffset.left, top: blipOffset.top, opacity: 0.4 + estimate.confidence * 0.6 },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.readouts}>
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>{rssi != null ? `${rssi} dBm` : '—'}</Text>
          <Text style={styles.readoutLabel}>Signal</Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>{estimate.distanceMeters} m</Text>
          <Text style={styles.readoutLabel}>Distance</Text>
        </View>
        <View style={styles.readout}>
          <Text style={styles.readoutValue}>{Math.round(estimate.confidence * 100)}%</Text>
          <Text style={styles.readoutLabel}>Confidence</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  radar: {
    width: SIZE,
    height: SIZE,
    marginVertical: 8,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#1f3345',
    borderRadius: SIZE,
  },
  ringOuter: {
    left: RING_INSET,
    top: RING_INSET,
    width: RADIUS * 2,
    height: RADIUS * 2,
  },
  ringMid: {
    left: CENTER - RADIUS * 0.66,
    top: CENTER - RADIUS * 0.66,
    width: RADIUS * 1.32,
    height: RADIUS * 1.32,
  },
  ringInner: {
    left: CENTER - RADIUS * 0.33,
    top: CENTER - RADIUS * 0.33,
    width: RADIUS * 0.66,
    height: RADIUS * 0.66,
  },
  crosshairV: {
    position: 'absolute',
    left: CENTER,
    top: RING_INSET,
    width: 1,
    height: RADIUS * 2,
    backgroundColor: '#152534',
  },
  crosshairH: {
    position: 'absolute',
    top: CENTER,
    left: RING_INSET,
    height: 1,
    width: RADIUS * 2,
    backgroundColor: '#152534',
  },
  self: {
    position: 'absolute',
    left: CENTER - 5,
    top: CENTER - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
  },
  north: {
    position: 'absolute',
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  northText: {
    color: '#f87171',
    fontWeight: '800',
    fontSize: 12,
  },
  blip: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22d3ee',
    borderWidth: 2,
    borderColor: '#cffafe',
  },
  readouts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  readout: {
    alignItems: 'center',
  },
  readoutValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  readoutLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});
