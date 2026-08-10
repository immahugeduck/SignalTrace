import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnomalySeverity, TrafficAnomaly } from '@/types';

interface DataAnomalyListProps {
  anomalies: TrafficAnomaly[];
}

const SEVERITY_STYLE: Record<AnomalySeverity, { border: string; label: string }> = {
  info: { border: '#334155', label: '#93c5fd' },
  warning: { border: '#a16207', label: '#fcd34d' },
  critical: { border: '#7f1d1d', label: '#fca5a5' },
};

export function DataAnomalyList({ anomalies }: DataAnomalyListProps): React.JSX.Element {
  if (anomalies.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No unusual network activity detected. Alerts for suspicious uploads or
          exfiltration-like patterns will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {anomalies.map((anomaly) => {
        const palette = SEVERITY_STYLE[anomaly.severity];
        return (
          <View key={anomaly.id} style={[styles.row, { borderColor: palette.border }]}>
            <View style={styles.header}>
              <Text style={[styles.severity, { color: palette.label }]}>
                {anomaly.severity.toUpperCase()}
              </Text>
              <Text style={styles.time}>
                {new Date(anomaly.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.title}>{anomaly.title}</Text>
            <Text style={styles.detail}>{anomaly.detail}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    backgroundColor: '#0b1a26',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severity: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  time: {
    color: '#64748b',
    fontSize: 11,
  },
  title: {
    color: '#f3f4f6',
    fontWeight: '600',
    marginTop: 4,
  },
  detail: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: '#d1d5db',
  },
});
