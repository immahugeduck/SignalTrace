import React, { useMemo } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SignalSummaryCard } from '@/components/SignalSummaryCard';
import { TowerList } from '@/components/TowerList';
import { TowerMap } from '@/components/TowerMap';
import { appConfig, hasTowerApisConfigured } from '@/config';
import { ensureAndroidSignalPermissions } from '@/services/permissions';
import { useSignalStore } from '@/store/useSignalStore';

export default function App(): React.JSX.Element {
  const snapshots = useSignalStore((state) => state.snapshots);
  const isScanning = useSignalStore((state) => state.isScanning);
  const startScan = useSignalStore((state) => state.startScan);
  const stopScan = useSignalStore((state) => state.stopScan);
  const lastError = useSignalStore((state) => state.lastError);

  const latest = useMemo(() => snapshots.at(-1), [snapshots]);

  async function handleStartScan(): Promise<void> {
    const granted = await ensureAndroidSignalPermissions();
    if (!granted) {
      return;
    }

    await startScan();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>SignalTrace</Text>
        <Text style={styles.subtitle}>
          Android cellular signal and suspicious tower analyzer
        </Text>

        <SignalSummaryCard latest={latest} />
        <TowerMap snapshots={snapshots} />

        <View style={styles.controls}>
          <Pressable
            style={[styles.button, isScanning ? styles.buttonMuted : styles.buttonPrimary]}
            onPress={isScanning ? stopScan : handleStartScan}
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

        <Text style={styles.listTitle}>Recent Cells</Text>
        <TowerList snapshots={snapshots} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    padding: 16,
    gap: 14,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
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
