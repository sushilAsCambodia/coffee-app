import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, Order, OrderStatus } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const STATUS_MAP: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending:    { label: 'Pending',     color: '#F59E0B', icon: 'time-outline' },
  preparing:  { label: 'Preparing',  color: '#8B5CF6', icon: 'cafe-outline' },
  ready:      { label: 'Ready',      color: '#3B82F6', icon: 'checkmark-circle-outline' },
  completed:  { label: 'Completed',  color: Colors.success, icon: 'checkmark-done-outline' },
  cancelled:  { label: 'Cancelled',  color: Colors.destructive, icon: 'close-circle-outline' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[orders] loadOrders error', e);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  const renderOrder = ({ item }: { item: Order }) => {
    const statusInfo = STATUS_MAP[item.status] ?? STATUS_MAP.pending;
    const itemCount = item.items?.length ?? 0;
    const itemNames = item.items?.map(i => i.name).join(', ') ?? '';
    const date = new Date(item.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const isActive = ['pending', 'preparing', 'ready'].includes(item.status);

    return (
      <TouchableOpacity
        testID={`order-card-${item.id}`}
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/tracking/${item.id}`)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>{item.order_number}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <Text style={styles.orderItems} numberOfLines={2}>{itemNames}</Text>

        <View style={styles.orderFooter}>
          <Text style={styles.orderItemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.orderTotal}>${Number(item.total).toFixed(2)}</Text>
        </View>

        {item.service_mode && (
          <View style={styles.metaRow}>
            <Ionicons
              name={item.service_mode === 'dining' ? 'restaurant-outline' : 'bag-outline'}
              size={14}
              color={Colors.mutedForeground}
            />
            <Text style={styles.metaText}>
              {item.service_mode === 'dining' ? 'Dine In' : 'Takeaway'}
            </Text>
            <View style={styles.dot} />
            <Ionicons name="card-outline" size={14} color={Colors.mutedForeground} />
            <Text style={styles.metaText}>{item.payment_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
          </View>
        )}

        {isActive && (
          <View style={[styles.activeBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <Ionicons name="time-outline" size={14} color={statusInfo.color} />
            <Text style={[styles.activeText, { color: statusInfo.color }]}>In progress</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={Colors.muted} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
          <TouchableOpacity
            testID="start-ordering-btn"
            style={styles.orderBtn}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.orderBtnText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadOrders(); }}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  orderCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16,
    marginBottom: 14, ...Shadows.small,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  orderDate: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full,
  },
  statusText: { fontSize: Typography.xs, fontWeight: '600' },
  orderItems: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 12 },
  orderFooter: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 12,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  orderItemCount: { fontSize: Typography.sm, color: Colors.mutedForeground },
  orderTotal: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  metaText: { fontSize: Typography.xs, color: Colors.mutedForeground },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.mutedForeground, marginHorizontal: 4 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.md, alignSelf: 'flex-start',
  },
  activeText: { fontSize: Typography.xs, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, textAlign: 'center' },
  orderBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 14, paddingHorizontal: 32, marginTop: 8,
  },
  orderBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
