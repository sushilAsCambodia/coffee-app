import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await api.getAdminDashboard()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></SafeAreaView>;

  const stats = [
    { icon: 'receipt', label: 'Total Orders', value: data?.total_orders || 0, color: Colors.primary },
    { icon: 'cash', label: 'Revenue', value: `$${data?.total_revenue?.toFixed(2) || '0'}`, color: Colors.success },
    { icon: 'people', label: 'Customers', value: data?.total_users || 0, color: '#3B82F6' },
    { icon: 'bicycle', label: 'Drivers', value: data?.total_drivers || 0, color: Colors.accent },
    { icon: 'cafe', label: 'Products', value: data?.total_products || 0, color: '#8B5CF6' },
    { icon: 'time', label: 'Pending', value: data?.pending_orders || 0, color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.primary} />}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Admin Panel</Text>
            <Text style={s.title}>Dashboard</Text>
          </View>
          <TouchableOpacity testID="admin-logout-btn" style={s.logoutBtn} onPress={async () => { await logout(); router.replace('/'); }}>
            <Ionicons name="log-out-outline" size={22} color={Colors.destructive} />
          </TouchableOpacity>
        </View>

        <View style={s.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Status Overview</Text>
          <View style={s.statusGrid}>
            {Object.entries(data?.status_counts || {}).map(([key, count]) => (
              <View key={key} style={s.statusItem}>
                <Text style={s.statusCount}>{count as number}</Text>
                <Text style={s.statusLabel}>{key.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent Orders</Text>
          {data?.recent_orders?.slice(0, 8).map((order: any) => (
            <View key={order.order_id} style={s.orderItem}>
              <View style={{ flex: 1 }}>
                <Text style={s.orderId}>{order.order_id}</Text>
                <Text style={s.orderInfo}>{order.user_name || 'Customer'} · {order.items?.length || 0} items</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.orderTotal}>${order.total?.toFixed(2)}</Text>
                <View style={[s.badge, { backgroundColor: order.status === 'delivered' ? Colors.success + '20' : Colors.accent + '20' }]}>
                  <Text style={[s.badgeText, { color: order.status === 'delivered' ? Colors.success : Colors.accent }]}>{order.status?.replace(/_/g, ' ')}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: Typography.sm, color: Colors.mutedForeground },
  title: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 },
  statCard: { width: '30%', flexGrow: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 14, ...Shadows.small },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  statLabel: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, marginBottom: 14 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusItem: { backgroundColor: Colors.card, borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: 14, ...Shadows.small },
  statusCount: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  statusLabel: { fontSize: Typography.xs, color: Colors.mutedForeground, textTransform: 'capitalize' },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: 14, marginBottom: 8, ...Shadows.small },
  orderId: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },
  orderInfo: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  orderTotal: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
