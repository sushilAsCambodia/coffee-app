import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import MapView from '../../src/components/MapView';

export default function DriverDelivery() {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const locationInterval = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      const active = await api.getActiveDelivery();
      setOrder(active);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  // Simulate driver movement
  useEffect(() => {
    if (order) {
      let step = 0;
      locationInterval.current = setInterval(async () => {
        step += 1;
        const progress = Math.min(step * 0.05, 1);
        const shopLat = order.shop_lat || 11.5684;
        const shopLng = order.shop_lng || 104.9210;
        const destLat = order.delivery_lat || 11.5564;
        const destLng = order.delivery_lng || 104.9282;
        const newLat = shopLat + (destLat - shopLat) * progress + (Math.random() - 0.5) * 0.001;
        const newLng = shopLng + (destLng - shopLng) * progress + (Math.random() - 0.5) * 0.001;
        try { await api.updateDriverLocation(newLat, newLng); } catch {}
      }, 5000);
    }
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, [order]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.completeDelivery(order.order_id);
      Alert.alert('Delivered!', 'Great job! Order completed.', [
        { text: 'OK', onPress: () => { load(); router.push('/(driver)/dashboard'); } }
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setCompleting(false); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 100 }} /></SafeAreaView>;

  if (!order) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyState}>
          <Ionicons name="bicycle-outline" size={64} color={Colors.muted} />
          <Text style={s.emptyTitle}>No Active Delivery</Text>
          <Text style={s.emptySubtext}>Accept an order to start delivering</Text>
          <TouchableOpacity testID="go-orders-btn" style={s.goOrdersBtn} onPress={() => router.push('/(driver)/dashboard')}>
            <Text style={s.goOrdersBtnText}>View Available Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Active Delivery</Text>
        <Text style={s.orderId}>{order.order_id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={s.mapWrapper}>
          <MapView
            shopLat={order.shop_lat || 11.5684}
            shopLng={order.shop_lng || 104.9210}
            deliveryLat={order.delivery_lat || 11.5564}
            deliveryLng={order.delivery_lng || 104.9282}
            driverLat={order.driver?.lat}
            driverLng={order.driver?.lng}
            status="out_for_delivery"
          />
        </View>

        {/* Delivery Info */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Ionicons name="location" size={20} color="#3B82F6" />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Deliver To</Text>
              <Text style={s.infoValue}>{order.delivery_address}</Text>
            </View>
          </View>
          {order.user_name && (
            <View style={s.infoRow}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Customer</Text>
                <Text style={s.infoValue}>{order.user_name} · {order.user_phone}</Text>
              </View>
              <TouchableOpacity testID="call-customer-btn" style={s.callBtn}>
                <Ionicons name="call" size={18} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={s.itemsCard}>
          <Text style={s.cardTitle}>Order Items</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={s.itemRow}>
              <Text style={s.itemQty}>{item.quantity}x</Text>
              <Text style={s.itemName}>{item.product_name}</Text>
              <Text style={s.itemPrice}>${item.total_price?.toFixed(2)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>${order.total?.toFixed(2)}</Text>
          </View>
          {order.note ? <Text style={s.note}>Note: {order.note}</Text> : null}
        </View>

        {/* Complete Button */}
        <TouchableOpacity testID="complete-delivery-btn" style={s.completeBtn} onPress={handleComplete} disabled={completing} activeOpacity={0.85}>
          {completing ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={s.completeBtnText}>Mark as Delivered</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  orderId: { fontSize: Typography.xs, color: '#3B82F6', fontWeight: '600', backgroundColor: '#3B82F620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  mapWrapper: { marginHorizontal: 20, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.medium },
  infoCard: { backgroundColor: Colors.card, marginHorizontal: 20, marginTop: 16, borderRadius: BorderRadius.lg, padding: 16, ...Shadows.small },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  infoLabel: { fontSize: Typography.xs, color: Colors.mutedForeground },
  infoValue: { fontSize: Typography.base, fontWeight: '500', color: Colors.foreground },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F620', alignItems: 'center', justifyContent: 'center' },
  itemsCard: { backgroundColor: Colors.card, marginHorizontal: 20, marginTop: 12, borderRadius: BorderRadius.lg, padding: 16, ...Shadows.small },
  cardTitle: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  itemQty: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary, width: 28 },
  itemName: { flex: 1, fontSize: Typography.sm, color: Colors.foreground },
  itemPrice: { fontSize: Typography.sm, fontWeight: '500', color: Colors.foreground },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  totalValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  note: { fontSize: Typography.xs, color: Colors.mutedForeground, fontStyle: 'italic', marginTop: 8 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.success, marginHorizontal: 20, marginTop: 20, borderRadius: BorderRadius.full, paddingVertical: 18, ...Shadows.medium },
  completeBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  emptySubtext: { fontSize: Typography.sm, color: Colors.mutedForeground },
  goOrdersBtn: { backgroundColor: '#3B82F6', borderRadius: BorderRadius.full, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  goOrdersBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
});
