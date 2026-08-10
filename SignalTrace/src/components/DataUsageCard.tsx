import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TrafficSnapshot } from '@/types';
import { formatBytes, formatRate } from '@/utils/format';

interface DataUsageCardProps {
  latest?: TrafficSnapshot;
  supported: boolean;
  usageAccessGranted: boolean;
  onRequestUsageAccess: () => void;
}

export function DataUsageCard({
  latest,
  supported,
  usageAccessGranted,
  onRequestUsageAccess,
}: DataUsageCardProps): React.JSX.Element {
  if (!supported) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Data Monitor</Text>
        <Text style={styles.subtitle}>
          Network counters are unavailable on this device or build. The native
          TrafficStats module is required for live monitoring.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Data Monitor</Text>

      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Download</Text>
          <Text style={[styles.metricValue, styles.download]}>
            {latest ? formatRate(latest.rxBytesPerSecond) : '—'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Upload</Text>
          <Text style={[styles.metricValue, styles.upload]}>
            {latest ? formatRate(latest.txBytesPerSecond) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.total}>Session down: {formatBytes(latest?.totalRxBytes ?? 0)}</Text>
        <Text style={styles.total}>Session up: {formatBytes(latest?.totalTxBytes ?? 0)}</Text>
      </View>

      {!usageAccessGranted ? (
        <Pressable style={styles.grantButton} onPress={onRequestUsageAccess}>
          <Text style={styles.grantLabel}>
            Grant Usage Access for per-app monitoring
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.grantedText}>Per-app monitoring enabled</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#112030',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#d1d5db',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metric: {
    flex: 1,
    backgroundColor: '#0b1a26',
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  download: {
    color: '#38bdf8',
  },
  upload: {
    color: '#f59e0b',
  },
  total: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  grantButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  grantLabel: {
    color: '#eff6ff',
    fontWeight: '600',
    fontSize: 13,
  },
  grantedText: {
    color: '#86efac',
    fontSize: 12,
  },
});
