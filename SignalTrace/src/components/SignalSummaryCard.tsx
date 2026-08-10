import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScanSnapshot } from '@/types';
import { classifySignalQuality } from '@/utils/signalQuality';

interface SignalSummaryCardProps {
  latest?: ScanSnapshot;
}

export function SignalSummaryCard({ latest }: SignalSummaryCardProps): React.JSX.Element {
  if (!latest) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>No signal data yet</Text>
        <Text style={styles.subtitle}>Tap Start Scan to begin collecting cellular readings.</Text>
      </View>
    );
  }

  const ghost = latest.ghostAssessment;
  const quality = classifySignalQuality(latest.reading);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Current Cell Snapshot</Text>
      <View style={styles.qualityRow}>
        <Text style={styles.text}>Signal: {quality.label}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${quality.bars}%` }]} />
        </View>
      </View>
      <Text style={styles.text}>Radio: {latest.reading.radioType}</Text>
      <Text style={styles.text}>CID: {latest.reading.cid ?? 'Unknown'}</Text>
      <Text style={styles.text}>
        RSRP: {latest.reading.rsrp != null ? `${latest.reading.rsrp} dBm` : 'N/A'}
      </Text>
      <Text style={styles.text}>Ghost Risk Score: {ghost.score}</Text>
      <Text style={[styles.badge, ghost.isLikelyGhost ? styles.badgeDanger : styles.badgeSafe]}>
        {ghost.isLikelyGhost ? 'Suspicious Tower Pattern' : 'No High-Risk Pattern'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#112030',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#d1d5db',
  },
  text: {
    color: '#dbeafe',
    fontSize: 14,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#38bdf8',
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#f9fafb',
    alignSelf: 'flex-start',
  },
  badgeDanger: {
    backgroundColor: '#7f1d1d',
  },
  badgeSafe: {
    backgroundColor: '#14532d',
  },
});
