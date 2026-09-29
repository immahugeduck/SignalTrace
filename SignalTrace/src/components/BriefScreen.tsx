import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appConfig } from '@/config';
import { localBrief, sanitizeBriefInput } from '@/services/sanitizeBrief';
import { useBleStore } from '@/store/useBleStore';
import { useSignalStore } from '@/store/useSignalStore';
import { useTrafficStore } from '@/store/useTrafficStore';
import { useWifiStore } from '@/store/useWifiStore';

export function BriefScreen(): React.JSX.Element {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<'local' | 'remote' | null>(null);

  const run = async () => {
    setBusy(true);
    const snapshots = useSignalStore.getState().snapshots;
    const payload = sanitizeBriefInput({
      cells: snapshots.map((s) => s.reading),
      ghostFlagCount: snapshots.filter((s) => s.ghostAssessment.isLikelyGhost).length,
      wifi: useWifiStore.getState().accessPoints,
      ble: useBleStore.getState().devices,
      anomalies: useTrafficStore.getState().anomalies,
    });
    const fallback = localBrief(payload);
    const base = appConfig.signalTraceApiBaseUrl.replace(/\/$/, '');
    if (base) {
      try {
        const res = await fetch(`${base}/api/brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = (await res.json()) as { brief?: string };
          setText(json.brief?.trim() || fallback);
          setSource('remote');
          setBusy(false);
          return;
        }
      } catch {
        /* local fallback */
      }
    }
    setText(fallback);
    setSource('local');
    setBusy(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.lede}>
        Privacy-minimized brief. Only counts, radio types, security classes, and
        heuristic flags are used. No BSSID, MAC, cell ID, IP, or device name leaves the phone.
      </Text>
      <Pressable style={styles.btn} onPress={() => void run()} disabled={busy}>
        <Text style={styles.btnLabel}>{busy ? 'Building...' : 'Generate brief'}</Text>
      </Pressable>
      {source ? (
        <Text style={styles.meta}>Source: {source === 'remote' ? 'API' : 'on-device fallback'}</Text>
      ) : null}
      {text ? <Text style={styles.body}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  lede: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  btn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnLabel: { color: '#f8fafc', fontWeight: '700' },
  meta: { color: '#64748b', fontSize: 12 },
  body: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },
});
