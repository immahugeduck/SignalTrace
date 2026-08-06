import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ScanSnapshot } from '@/types';

interface TowerMapProps {
  snapshots: ScanSnapshot[];
}

export function TowerMap({ snapshots }: TowerMapProps): React.JSX.Element {
  const points = snapshots
    .map((item) => item.tower)
    .filter((tower): tower is NonNullable<typeof tower> => Boolean(tower));

  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Tower map will appear when API lookups resolve coordinates.</Text>
      </View>
    );
  }

  const first = points[0];
  return (
    <View style={styles.wrapper}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: first.latitude,
          longitude: first.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >
        {points.map((tower, index) => (
          <Marker
            key={`${tower.cid}-${index}`}
            coordinate={{ latitude: tower.latitude, longitude: tower.longitude }}
            title={`CID ${tower.cid ?? 'Unknown'}`}
            description={`${tower.source} | confidence ${Math.round(tower.confidence * 100)}%`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  map: {
    flex: 1,
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
