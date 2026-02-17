import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const STATUSES = ['all', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#F59E0B', confirmed: Colors.primary, preparing: '#8B5CF6',
  ready: '#10B981', out_for_delivery: '#3B82F6', delivered: Colors.success, cancelled: Colors.destructive,
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setOrders(await api.getAdminOrders(filter === 'all' ? undefined : filter)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [filter]));

  const nextStatus = (current: string): string | null => {
    const flow: Record<string, string> = { confirmed: 'preparing', preparing: 'ready', ready: 'out_for_delivery' };
    return flow[current] || null;
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setUpdating(null); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Orders ({orders.length})</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
        {STATUSES.map(st => (
          <TouchableOpacity key={st} testID={`filter-${st}`} style={[s.filterChip, filter === st && s.filterChipActive]} onPress={() => { setFilter(st); setLoading(true); }}>
            <Text style={[s.filterText, filter === st && s.filterTextActive]}>{st === 'all' ? 'All' : st.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList data={orders} keyExtractor={i => i.order_id} contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const next = nextStatus(item.status);
          const color = STATUS_COLORS[item.status] || Colors.primary;
          return (
            <View style={s.orderCard}>
              <View style={s.orderHeader}>
                <View>
                  <Text style={s.orderId}>{item.order_id}</Text>
                  <Text style={s.orderDate}>{new Date(item.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: color + '20' }]}>
                  <Text style={[s.statusText, { color }]}>{item.status?.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <Text style={s.customerInfo}>{item.user_name || 'Customer'} · {item.user_phone || ''}</Text>
              <Text style={s.itemsList} numberOfLines={2}>{item.items?.map((i: any) => `${i.quantity}x ${i.product_name}`).join(', ')}</Text>
              <View style={s.orderFooter}>
                <Text style={s.orderTotal}>${item.total?.toFixed(2)}</Text>
                {next && (
                  <TouchableOpacity testID={`advance-${item.order_id}`} style={s.advanceBtn} onPress={() => handleStatusUpdate(item.order_id, next)} disabled={updating === item.order_id}>
                    {updating === item.order_id ? <ActivityIndicator size="small" color={Colors.primaryForeground} /> :
                      <Text style={s.advanceBtnText}>→ {next.replace(/_/g, ' ')}</Text>}
                  </TouchableOpacity>
                )}
                {item.status === 'delivered' && <Ionicons name="checkmark-done-circle" size={24} color={Colors.success} />}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="receipt-outline" size={48} color={Colors.muted} /><Text style={s.emptyText}>No orders</Text></View>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  filterScroll: { maxHeight: 48, marginBottom: 8 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.muted },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: Typography.sm, color: Colors.foreground, textTransform: 'capitalize' },
  filterTextActive: { color: Colors.primaryForeground, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  orderCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 10, ...Shadows.small },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  orderDate: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: Typography.xs, fontWeight: '600', textTransform: 'capitalize' },
  customerInfo: { fontSize: Typography.sm, color: Colors.foreground, marginTop: 10, fontWeight: '500' },
  itemsList: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  orderTotal: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  advanceBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  advanceBtnText: { color: Colors.primaryForeground, fontSize: Typography.sm, fontWeight: '600', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: Typography.base },
});
