import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ScanSnapshot } from '@/types';

interface TowerListProps {
  snapshots: ScanSnapshot[];
}

export function TowerList({ snapshots }: TowerListProps): React.JSX.Element {
  const items = [...snapshots].reverse();

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => `${item.reading.timestamp}-${index}`}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.primary}>
            {item.reading.radioType} | CID {item.reading.cid ?? 'Unknown'}
          </Text>
          <Text style={styles.secondary}>RSRP {item.reading.rsrp ?? 'N/A'} dBm</Text>
          <Text style={styles.secondary}>Source {item.tower?.source ?? 'Unresolved'}</Text>
          {item.ghostAssessment.reasons[0] ? (
            <Text style={styles.warning}>{item.ghostAssessment.reasons[0]}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingBottom: 180,
  },
  row: {
    backgroundColor: '#0b1a26',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  primary: {
    color: '#f3f4f6',
    fontWeight: '600',
  },
  secondary: {
    color: '#9ca3af',
    fontSize: 12,
  },
  warning: {
    marginTop: 6,
    color: '#fca5a5',
    fontSize: 12,
  },
});
