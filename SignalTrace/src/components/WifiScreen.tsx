import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useWifiStore } from '@/store/useWifiStore';

export function WifiScreen(): React.JSX.Element {
  const { accessPoints, scanning, error, lastScanAt, scan } = useWifiStore();
  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>
        Nearby access points from this phone's Wi-Fi radio. RSSI is not distance.
        Open / WEP / TKIP are weak-encryption leads, not proof of anything.
      </Text>
      <Pressable style={styles.btn} onPress={() => void scan()} disabled={scanning}>
        <Text style={styles.btnLabel}>{scanning ? 'Scanning...' : 'Scan Wi-Fi'}</Text>
      </Pressable>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {lastScanAt ? (
        <Text style={styles.meta}>
          {accessPoints.length} APs - {new Date(lastScanAt).toLocaleTimeString()}
        </Text>
      ) : null}
      {accessPoints.map((ap) => (
        <View key={ap.bssid} style={styles.row}>
          <Text style={styles.ssid}>{ap.ssid}</Text>
          <Text style={styles.meta}>
            {ap.rssi} dBm - {ap.band} - {ap.security}
          </Text>
          <Text style={styles.hint}>
            BSSID last-2 {ap.bssidTail} - {ap.capabilities}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  lede: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  btn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnLabel: { color: '#f8fafc', fontWeight: '700' },
  err: { color: '#f87171' },
  row: { backgroundColor: '#0f1b2a', borderRadius: 10, padding: 12, gap: 4 },
  ssid: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  meta: { color: '#94a3b8', fontSize: 13 },
  hint: { color: '#64748b', fontSize: 11 },
});
