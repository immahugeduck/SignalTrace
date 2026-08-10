import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BleDevice } from '@/types';
import { BleSignalChart } from '@/components/BleSignalChart';

interface BleDeviceDetailProps {
  device: BleDevice;
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

export function BleDeviceDetail({ device }: BleDeviceDetailProps): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Signal strength</Text>
          <Text style={styles.distance}>↗ {device.distanceMeters} m</Text>
        </View>
        <BleSignalChart history={device.history} />
      </View>

      <Text style={styles.section}>Bluetooth information</Text>
      <View style={styles.grid}>
        <Field label="Name" value={device.name ?? 'null'} />
        <Field label="Signal" value={`${device.rssi}`} />
        <Field label="MAC address" value={device.address} />
        <Field label="Status" value={device.bondState} />
      </View>
      <View style={styles.grid}>
        <Field label="Type" value={device.type} />
        <Field
          label="Manufacturer"
          value={device.manufacturerData ? device.manufacturerData : '—'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  card: {
    backgroundColor: '#0b1a26',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '700',
  },
  distance: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  field: {
    flex: 1,
    alignItems: 'center',
  },
  fieldValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});
