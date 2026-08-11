import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DataAnomalyList } from '@/components/DataAnomalyList';
import { DataUsageCard } from '@/components/DataUsageCard';
import { SignalSummaryCard } from '@/components/SignalSummaryCard';
import { TowerList } from '@/components/TowerList';
import { TowerMap } from '@/components/TowerMap';
import { appConfig, hasTowerApisConfigured } from '@/config';
import { ensureAndroidSignalPermissions } from '@/services/permissions';
import { useSignalStore } from '@/store/useSignalStore';
import { useTrafficStore } from '@/store/useTrafficStore';

export function CellularScreen(): React.JSX.Element {
  const snapshots = useSignalStore((state) => state.snapshots);
  const isScanning = useSignalStore((state) => state.isScanning);
  const startScan = useSignalStore((state) => state.startScan);
  const stopScan = useSignalStore((state) => state.stopScan);
  const lastError = useSignalStore((state) => state.lastError);

  const trafficLatest = useTrafficStore((state) => state.latest);
  const trafficSupported = useTrafficStore((state) => state.supported);
  const usageAccessGranted = useTrafficStore((state) => state.usageAccessGranted);
  const anomalies = useTrafficStore((state) => state.anomalies);
  const startMonitoring = useTrafficStore((state) => state.startMonitoring);
  const stopMonitoring = useTrafficStore((state) => state.stopMonitoring);
  const openUsageAccessSettings = useTrafficStore((state) => state.openUsageAccessSettings);
  const trafficError = useTrafficStore((state) => state.lastError);

  const latest = useMemo(() => snapshots.at(-1), [snapshots]);

  async function handleStartScan(): Promise<void> {
    const granted = await ensureAndroidSignalPermissions();
    if (!granted) {
      return;
    }

    await Promise.all([startScan(), startMonitoring()]);
  }

  function handleStopScan(): void {
    stopScan();
    stopMonitoring();
  }

  return (
    <View style={styles.container}>
      <SignalSummaryCard latest={latest} />
      <TowerMap snapshots={snapshots} />

      <DataUsageCard
        latest={trafficLatest}
        supported={trafficSupported}
        usageAccessGranted={usageAccessGranted}
        onRequestUsageAccess={openUsageAccessSettings}
      />

      <View style={styles.controls}>
        <Pressable
          style={[styles.button, isScanning ? styles.buttonMuted : styles.buttonPrimary]}
          onPress={isScanning ? handleStopScan : handleStartScan}
        >
          <Text style={styles.buttonLabel}>{isScanning ? 'Stop Scan' : 'Start Scan'}</Text>
        </Pressable>
      </View>

      {!hasTowerApisConfigured ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Add OPENCELLID_API_KEY and WIGLE_API_TOKEN to enable live tower geolocation.
          </Text>
        </View>
      ) : null}

      {appConfig.signalTraceApiBaseUrl ? (
        <Text style={styles.apiText}>Backend connected: {appConfig.signalTraceApiBaseUrl}</Text>
      ) : null}

      {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
      {trafficError ? <Text style={styles.errorText}>{trafficError}</Text> : null}

      <Text style={styles.listTitle}>Network Alerts</Text>
      <DataAnomalyList anomalies={anomalies} />

      <Text style={styles.listTitle}>Recent Cells</Text>
      <TowerList snapshots={snapshots} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  controls: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonMuted: {
    backgroundColor: '#334155',
  },
  buttonLabel: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  notice: {
    backgroundColor: '#7c2d12',
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    color: '#fed7aa',
  },
  apiText: {
    color: '#93c5fd',
    fontSize: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  listTitle: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 16,
  },
});
