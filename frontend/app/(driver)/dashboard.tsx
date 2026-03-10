import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function DriverDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [avail, active] = await Promise.all([api.getAvailableOrders(), api.getActiveDelivery()]);
      setOrders(avail);
      setActiveDelivery(active);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    try {
      await api.acceptOrder(orderId);
      Alert.alert('Accepted!', 'Order assigned to you. Start delivery!');
      load();
      router.push('/(driver)/delivery');
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setAccepting(null); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 100 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Driver Portal</Text>
          <Text style={s.name}>{user?.name || 'Driver'}</Text>
        </View>
        <View style={[s.statusDot, { backgroundColor: Colors.success }]} />
      </View>

      {activeDelivery && (
        <TouchableOpacity testID="active-delivery-card" style={s.activeCard} onPress={() => router.push('/(driver)/delivery')} activeOpacity={0.85}>
          <View style={s.activeHeader}>
            <View style={s.activePulse} />
            <Text style={s.activeLabel}>Active Delivery</Text>
          </View>
          <Text style={s.activeOrderId}>{activeDelivery.order_id}</Text>
          <Text style={s.activeAddress} numberOfLines={1}>{activeDelivery.delivery_address}</Text>
          <View style={s.activeFooter}>
            <Text style={s.activeTotal}>${activeDelivery.total?.toFixed(2)}</Text>
            <View style={s.goBtn}>
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={s.goBtnText}>Navigate</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <Text style={s.sectionTitle}>Available Orders ({orders.length})</Text>

      <FlatList data={orders} keyExtractor={i => i.order_id} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3B82F6" />}
        renderItem={({ item }) => (
          <View style={s.orderCard}>
            <View style={s.orderHeader}>
              <Text style={s.orderId}>{item.order_id}</Text>
              <View style={[s.badge, { backgroundColor: item.status === 'ready' ? Colors.success + '20' : Colors.accent + '20' }]}>
                <Text style={[s.badgeText, { color: item.status === 'ready' ? Colors.success : Colors.accent }]}>{item.status?.replace(/_/g, ' ')}</Text>
              </View>
            </View>
            <View style={s.orderInfo}>
              <Ionicons name="location-outline" size={16} color={Colors.mutedForeground} />
              <Text style={s.orderAddress} numberOfLines={1}>{item.delivery_address}</Text>
            </View>
            <Text style={s.orderItems} numberOfLines={1}>{item.items?.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')}</Text>
            <View style={s.orderFooter}>
              <Text style={s.orderTotal}>${item.total?.toFixed(2)}</Text>
              <TouchableOpacity testID={`accept-${item.order_id}`} style={s.acceptBtn} onPress={() => handleAccept(item.order_id)} disabled={accepting === item.order_id || !!activeDelivery}>
                {accepting === item.order_id ? <ActivityIndicator size="small" color="#fff" /> :
                  <Text style={s.acceptBtnText}>{activeDelivery ? 'Busy' : 'Accept'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="cube-outline" size={48} color={Colors.muted} /><Text style={s.emptyText}>No available orders</Text><Text style={s.emptySubtext}>Pull down to refresh</Text></View>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: Typography.sm, color: Colors.mutedForeground },
  name: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  statusDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.card },
  activeCard: { marginHorizontal: 20, backgroundColor: '#3B82F6', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 20, ...Shadows.large },
  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  activeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, fontWeight: '600' },
  activeOrderId: { color: '#fff', fontSize: Typography.xl, fontWeight: '700', marginTop: 8 },
  activeAddress: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, marginTop: 4 },
  activeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  activeTotal: { color: '#fff', fontSize: Typography.lg, fontWeight: '700' },
  goBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  goBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: '600' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  orderCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 10, ...Shadows.small },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  orderAddress: { fontSize: Typography.sm, color: Colors.mutedForeground, flex: 1 },
  orderItems: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 6 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  orderTotal: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  acceptBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 10, borderRadius: BorderRadius.full },
  acceptBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { color: Colors.mutedForeground, fontSize: Typography.base, fontWeight: '500' },
  emptySubtext: { color: Colors.mutedForeground, fontSize: Typography.xs },
});
