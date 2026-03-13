import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const PREFS_KEY = '@coffee_app_notif_prefs';

type Prefs = {
  order_updates: boolean;
  order_ready: boolean;
  promotions: boolean;
  new_items: boolean;
  news: boolean;
};

const DEFAULT_PREFS: Prefs = {
  order_updates: true,
  order_ready: true,
  promotions: true,
  new_items: false,
  news: false,
};

type NotifItem = {
  key: keyof Prefs;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
};

const ITEMS: NotifItem[] = [
  { key: 'order_updates', icon: 'receipt-outline', iconBg: '#EBF4FF', iconColor: '#3B82F6', title: 'Order Updates', subtitle: 'Status changes: preparing, ready, completed' },
  { key: 'order_ready', icon: 'checkmark-circle-outline', iconBg: '#ECFDF5', iconColor: '#059669', title: 'Order Ready', subtitle: 'Notify when your order is ready to pick up' },
  { key: 'promotions', icon: 'pricetag-outline', iconBg: '#FEF3C7', iconColor: '#D97706', title: 'Promotions & Offers', subtitle: 'Special deals and discounts just for you' },
  { key: 'new_items', icon: 'cafe-outline', iconBg: '#FDF4FF', iconColor: '#9333EA', title: 'New Menu Items', subtitle: 'Be the first to know about new drinks & food' },
  { key: 'news', icon: 'newspaper-outline', iconBg: '#F0FDF4', iconColor: '#16A34A', title: 'Cafe Empire News', subtitle: 'Updates about events and announcements' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then(raw => {
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    });
  }, []);

  const toggle = async (key: keyof Prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  const allOn = Object.values(prefs).every(Boolean);
  const toggleAll = async () => {
    const updated = Object.fromEntries(Object.keys(prefs).map(k => [k, !allOn])) as Prefs;
    setPrefs(updated);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="notifications" size={28} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Stay in the loop</Text>
            <Text style={styles.bannerSubtitle}>Choose what you'd like to be notified about</Text>
          </View>
        </View>

        {/* Master toggle */}
        <TouchableOpacity style={styles.masterRow} onPress={toggleAll} activeOpacity={0.7}>
          <Text style={styles.masterLabel}>{allOn ? 'Mute All Notifications' : 'Enable All Notifications'}</Text>
          <View style={[styles.toggle, allOn && styles.toggleOn]}>
            <View style={[styles.toggleThumb, allOn && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        {/* Individual toggles */}
        <View style={styles.card}>
          {ITEMS.map((item, idx) => (
            <View key={item.key} style={[styles.row, idx < ITEMS.length - 1 && styles.rowBorder]}>
              <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={Colors.border}
              />
            </View>
          ))}
        </View>

        <Text style={styles.hint}>
          Notification preferences are stored on this device. Push notification delivery depends on your system settings.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.xl, padding: 16,
  },
  bannerIconBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', ...Shadows.small,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  bannerSubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 2 },
  masterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 16, ...Shadows.small,
  },
  masterLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: Typography.base, fontWeight: '500', color: Colors.foreground },
  rowSubtitle: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2, lineHeight: 16 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: Colors.border, padding: 2 },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', ...Shadows.small },
  toggleThumbOn: { alignSelf: 'flex-end' },
  hint: { fontSize: Typography.xs, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 },
});
