import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function DriverHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setOrders(await api.getDriverHistory()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 100 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}><Text style={s.title}>Delivery History</Text></View>

      <FlatList data={orders} keyExtractor={i => i.order_id} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#3B82F6" />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.orderId}>{item.order_id}</Text>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.success} />
            </View>
            <Text style={s.address} numberOfLines={1}>{item.delivery_address}</Text>
            <Text style={s.items} numberOfLines={1}>{item.items?.map((i: any) => i.product_name).join(', ')}</Text>
            <View style={s.cardFooter}>
              <Text style={s.date}>{item.delivered_at ? new Date(item.delivered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              <Text style={s.total}>${item.total?.toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="time-outline" size={48} color={Colors.muted} /><Text style={s.emptyText}>No deliveries yet</Text></View>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 10, ...Shadows.small },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  address: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 6 },
  items: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  date: { fontSize: Typography.xs, color: Colors.mutedForeground },
  total: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: Typography.base },
});
