import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BleDevice } from '@/types';

interface BleDeviceListProps {
  devices: BleDevice[];
  realtime: boolean;
  onToggleRealtime: (value: boolean) => void;
  onSelect: (address: string) => void;
}

function signalColor(rssi: number): string {
  if (rssi >= -60) {
    return '#4ade80';
  }
  if (rssi >= -75) {
    return '#facc15';
  }
  return '#f87171';
}

export function BleDeviceList({
  devices,
  realtime,
  onToggleRealtime,
  onSelect,
}: BleDeviceListProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby devices ({devices.length})</Text>
        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>Real-time data</Text>
          <Switch
            value={realtime}
            onValueChange={onToggleRealtime}
            trackColor={{ true: '#2563eb', false: '#334155' }}
            thumbColor="#f8fafc"
          />
        </View>
      </View>

      {devices.length === 0 ? (
        <Text style={styles.empty}>Scanning… move around to discover nearby devices.</Text>
      ) : (
        devices.map((device) => (
          <Pressable
            key={device.address}
            style={styles.row}
            onPress={() => onSelect(device.address)}
          >
            <View style={styles.rowMain}>
              <Text style={styles.name}>{device.name ?? 'Unknown'}</Text>
              <Text style={styles.address}>{device.address}</Text>
            </View>
            <View style={styles.rowMeta}>
              <Text style={[styles.rssi, { color: signalColor(device.rssi) }]}>
                {device.rssi} dBm
              </Text>
              <Text style={styles.distance}>≈ {device.distanceMeters} m</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#112030',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '700',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  empty: {
    color: '#94a3b8',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#1f2937',
  },
  rowMain: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    color: '#f3f4f6',
    fontWeight: '600',
  },
  address: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  rowMeta: {
    alignItems: 'flex-end',
  },
  rssi: {
    fontWeight: '700',
  },
  distance: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
});
