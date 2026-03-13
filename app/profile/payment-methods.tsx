import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const METHODS = [
  { icon: 'cash-outline', label: 'Cash', desc: 'Pay at counter on pickup', iconBg: '#ECFDF5', iconColor: '#059669', available: true },
  { icon: 'phone-portrait-outline', label: 'ABA Pay', desc: 'Scan QR to pay via ABA Mobile', iconBg: '#EBF4FF', iconColor: '#3B82F6', available: true },
  { icon: 'wallet-outline', label: 'WING', desc: 'Pay via WING mobile wallet', iconBg: '#FEF3C7', iconColor: '#D97706', available: true },
  { icon: 'card-outline', label: 'Visa / Mastercard', desc: 'Coming soon', iconBg: '#F8FAFC', iconColor: '#94A3B8', available: false },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="card" size={28} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.bannerTitle}>Accepted Payments</Text>
            <Text style={styles.bannerSubtitle}>Available methods at Cafe Empire outlets</Text>
          </View>
        </View>

        <View style={styles.card}>
          {METHODS.map((m, idx) => (
            <View key={m.label} style={[styles.row, idx < METHODS.length - 1 && styles.rowBorder, !m.available && styles.rowDisabled]}>
              <View style={[styles.iconBox, { backgroundColor: m.iconBg }]}>
                <Ionicons name={m.icon as any} size={22} color={m.iconColor} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, !m.available && styles.rowTitleDisabled]}>{m.label}</Text>
                <Text style={styles.rowDesc}>{m.desc}</Text>
              </View>
              {m.available
                ? <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                : <View style={styles.soonBadge}><Text style={styles.soonText}>Soon</Text></View>
              }
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.mutedForeground} />
          <Text style={styles.infoText}>
            Payment method selection is available at checkout. The selected method is confirmed when you place your order.
          </Text>
        </View>

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
  bannerIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.small },
  bannerTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  bannerSubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowDisabled: { opacity: 0.55 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  rowTitleDisabled: { color: Colors.mutedForeground },
  rowDesc: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  soonBadge: { backgroundColor: Colors.muted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  soonText: { fontSize: 11, fontWeight: '700', color: Colors.mutedForeground },
  infoBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 14, ...Shadows.small },
  infoText: { flex: 1, fontSize: Typography.xs, color: Colors.mutedForeground, lineHeight: 18 },
});
