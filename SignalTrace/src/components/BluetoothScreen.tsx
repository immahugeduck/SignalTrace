import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BleDeviceDetail } from '@/components/BleDeviceDetail';
import { BleDeviceList } from '@/components/BleDeviceList';
import { BleRadar } from '@/components/BleRadar';
import { ensureBluetoothPermissions } from '@/services/permissions';
import { useBleStore } from '@/store/useBleStore';

export function BluetoothScreen(): React.JSX.Element {
  const devices = useBleStore((state) => state.devices);
  const isScanning = useBleStore((state) => state.isScanning);
  const realtime = useBleStore((state) => state.realtime);
  const supported = useBleStore((state) => state.supported);
  const lastError = useBleStore((state) => state.lastError);
  const selectedAddress = useBleStore((state) => state.selectedAddress);
  const samplingAddress = useBleStore((state) => state.samplingAddress);
  const heading = useBleStore((state) => state.heading);
  const bearingEstimate = useBleStore((state) => state.bearingEstimate);

  const startScan = useBleStore((state) => state.startScan);
  const stopScan = useBleStore((state) => state.stopScan);
  const setRealtime = useBleStore((state) => state.setRealtime);
  const selectDevice = useBleStore((state) => state.selectDevice);
  const startBearingSampling = useBleStore((state) => state.startBearingSampling);
  const stopBearingSampling = useBleStore((state) => state.stopBearingSampling);

  const selected = useMemo(
    () => devices.find((device) => device.address === selectedAddress),
    [devices, selectedAddress],
  );

  // Stop scanning when the screen unmounts (e.g. switching tabs).
  useEffect(() => {
    return () => {
      void stopScan();
    };
  }, [stopScan]);

  async function handleToggleScan(): Promise<void> {
    if (isScanning) {
      await stopScan();
      return;
    }
    const granted = await ensureBluetoothPermissions();
    if (!granted) {
      return;
    }
    await startScan();
  }

  async function handleCloseDetail(): Promise<void> {
    await stopBearingSampling();
    selectDevice(undefined);
  }

  const isSampling = Boolean(selected && samplingAddress === selected.address);

  return (
    <View style={styles.container}>
      <Text style={styles.lead}>
        Live Bluetooth tracking — nearby devices, signal history, RSSI distance, and a
        direction-finding radar.
      </Text>

      <View style={styles.controls}>
        <Pressable
          style={[styles.button, isScanning ? styles.buttonMuted : styles.buttonPrimary]}
          onPress={handleToggleScan}
        >
          <Text style={styles.buttonLabel}>{isScanning ? 'Stop Scan' : 'Start Scan'}</Text>
        </Pressable>
      </View>

      {!supported ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Bluetooth scanning isn&apos;t available. Ensure the native build includes the BLE
            module and that Bluetooth is on.
          </Text>
        </View>
      ) : null}

      {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}

      <BleDeviceList
        devices={devices}
        realtime={realtime}
        onToggleRealtime={setRealtime}
        onSelect={selectDevice}
      />

      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        transparent
        onRequestClose={handleCloseDetail}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {selected?.name ?? selected?.address ?? 'Device'}
              </Text>
              <Pressable onPress={handleCloseDetail} hitSlop={12}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              {selected ? (
                isSampling ? (
                  <BleRadar
                    deviceLabel={selected.name ?? selected.address}
                    rssi={selected.rssi}
                    heading={heading}
                    estimate={bearingEstimate}
                  />
                ) : (
                  <BleDeviceDetail device={selected} />
                )
              ) : null}
            </ScrollView>

            <View style={styles.sheetActions}>
              {isSampling ? (
                <Pressable
                  style={[styles.button, styles.buttonMuted, styles.flex]}
                  onPress={() => void stopBearingSampling()}
                >
                  <Text style={styles.buttonLabel}>Stop Finding</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.button, styles.buttonPrimary, styles.flex]}
                  onPress={() => selected && void startBearingSampling(selected.address)}
                >
                  <Text style={styles.buttonLabel}>Find Direction</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  lead: {
    color: '#94a3b8',
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
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
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
  },
  sheet: {
    backgroundColor: '#0f1b2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  close: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: '700',
  },
  sheetBody: {
    paddingBottom: 12,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
