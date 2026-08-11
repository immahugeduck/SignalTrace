import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BluetoothScreen } from '@/components/BluetoothScreen';
import { CellularScreen } from '@/components/CellularScreen';

type Tab = 'cellular' | 'bluetooth';

const TABS: { key: Tab; label: string }[] = [
  { key: 'cellular', label: 'Cellular' },
  { key: 'bluetooth', label: 'Bluetooth' },
];

export default function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('cellular');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>SignalTrace</Text>
        <Text style={styles.subtitle}>
          Android cellular, tower, data-traffic, and Bluetooth analyzer
        </Text>

        <View style={styles.tabs}>
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
                onPress={() => setTab(item.key)}
              >
                <Text style={[styles.tabLabel, active ? styles.tabLabelActive : undefined]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'cellular' ? <CellularScreen /> : <BluetoothScreen />}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0f1b2a',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabInactive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#f8fafc',
  },
});
