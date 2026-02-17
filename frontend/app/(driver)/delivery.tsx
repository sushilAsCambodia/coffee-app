import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
  ScrollView, Linking, Platform, Animated, Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import GrabStyleMap from '../../src/components/GrabStyleMap';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.45;

export default function DriverDelivery() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationInterval = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const load = useCallback(async () => {
    try {
      const active = await api.getActiveDelivery();
      setOrder(active);
      if (active?.driver?.lat && active?.driver?.lng) {
        setCurrentLocation({ lat: active.driver.lat, lng: active.driver.lng });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (order && order.status === 'out_for_delivery') {
      let step = 0;
      const shopLat = order.shop_lat || 11.5684;
      const shopLng = order.shop_lng || 104.921;
      const destLat = order.delivery_lat || 11.5564;
      const destLng = order.delivery_lng || 104.9282;
      let startLat = currentLocation?.lat || shopLat;
      let startLng = currentLocation?.lng || shopLng;

      locationInterval.current = setInterval(async () => {
        step += 1;
        const progress = Math.min(step * 0.03, 0.95);
        const newLat = startLat + (destLat - startLat) * progress + (Math.random() - 0.5) * 0.0005;
        const newLng = startLng + (destLng - startLng) * progress + (Math.random() - 0.5) * 0.0005;
        setCurrentLocation({ lat: newLat, lng: newLng });
        try { await api.updateDriverLocation(newLat, newLng); } catch {}
      }, 4000);
    }
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, [order]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.completeDelivery(order.order_id);
      Alert.alert('Delivery Complete!', 'Great job! The order has been delivered.', [
        { text: 'OK', onPress: () => { load(); router.push('/(driver)/dashboard'); } }
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setCompleting(false); }
  };

  const handleCallCustomer = () => {
    if (order?.user_phone) Linking.openURL(`tel:${order.user_phone}`);
  };

  const handleOpenMaps = () => {
    const lat = order?.delivery_lat || 11.5564;
    const lng = order?.delivery_lng || 104.9282;
    const url = Platform.select({ ios: `maps:0,0?q=${lat},${lng}`, android: `geo:0,0?q=${lat},${lng}` });
    if (url) Linking.openURL(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading delivery...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bicycle-outline" size={64} color="#00B14F" />
          </View>
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptySubtext}>Accept an order from the dashboard to start delivering</Text>
          <TouchableOpacity testID="go-orders-btn" style={styles.goOrdersBtn} onPress={() => router.push('/(driver)/dashboard')} activeOpacity={0.85}>
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={styles.goOrdersBtnText}>View Available Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const eta = order.estimated_delivery ? new Date(order.estimated_delivery) : null;
  const etaMinutes = eta ? Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000)) : null;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <GrabStyleMap
          shopLat={order.shop_lat || 11.5684}
          shopLng={order.shop_lng || 104.921}
          deliveryLat={order.delivery_lat || 11.5564}
          deliveryLng={order.delivery_lng || 104.9282}
          driverLat={currentLocation?.lat || order.driver?.lat}
          driverLng={currentLocation?.lng || order.driver?.lng}
          status="out_for_delivery"
        />
        <SafeAreaView style={styles.topBar} edges={['top']}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
          </TouchableOpacity>
          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText}>{order.order_id}</Text>
          </View>
          <TouchableOpacity style={styles.navigateBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
            <Ionicons name="navigate" size={20} color="#00B14F" />
          </TouchableOpacity>
        </SafeAreaView>
        <View style={styles.statusBanner}>
          <Animated.View style={[styles.pulseIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="bicycle" size={22} color="#fff" />
          </Animated.View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Active Delivery</Text>
            {etaMinutes !== null && <Text style={styles.statusEta}>ETA: {etaMinutes} minutes</Text>}
          </View>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}><Text style={styles.customerInitial}>{order.user_name?.charAt(0) || 'C'}</Text></View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.user_name || 'Customer'}</Text>
            <Text style={styles.customerPhone}>{order.user_phone}</Text>
          </View>
          <TouchableOpacity testID="call-customer-btn" style={styles.callBtn} onPress={handleCallCustomer} activeOpacity={0.8}>
            <Ionicons name="call" size={22} color="#00B14F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.messageBtn} activeOpacity={0.8}>
            <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <View style={styles.addressIconWrap}><Ionicons name="location" size={22} color="#00B14F" /></View>
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>{order.delivery_address}</Text>
          <TouchableOpacity style={styles.directionsBtn} onPress={handleOpenMaps} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={18} color="#00B14F" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsCard}>
          <Text style={styles.cardTitle}>Order Details</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemQtyBadge}><Text style={styles.itemQtyText}>{item.quantity}</Text></View>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemPrice}>${item.total_price?.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalValue}>${order.total?.toFixed(2)}</Text>
          </View>
          {order.note ? <View style={styles.noteBox}><Ionicons name="document-text-outline" size={16} color={Colors.mutedForeground} /><Text style={styles.noteText}>{order.note}</Text></View> : null}
        </View>

        <TouchableOpacity testID="complete-delivery-btn" style={styles.completeBtn} onPress={handleComplete} disabled={completing} activeOpacity={0.85}>
          {completing ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.completeBtnText}>Mark as Delivered</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: Typography.base, color: Colors.mutedForeground },
  emptyContainer: { flex: 1, backgroundColor: Colors.background },
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  emptyIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0, 177, 79, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  emptySubtext: { fontSize: Typography.base, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 22 },
  goOrdersBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#00B14F', borderRadius: BorderRadius.full, paddingVertical: 16, paddingHorizontal: 32, marginTop: 12, ...Shadows.medium },
  goOrdersBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '600' },
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 12 : 0, paddingBottom: 12, zIndex: 100 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.medium },
  orderIdBadge: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, ...Shadows.small },
  orderIdText: { fontSize: 13, fontWeight: '700', color: Colors.foreground },
  navigateBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.medium },
  statusBanner: { position: 'absolute', bottom: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#00B14F', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 18, gap: 14, ...Shadows.large },
  pulseIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statusEta: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  contentScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 14, ...Shadows.small },
  customerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  customerInitial: { fontSize: 22, fontWeight: '700', color: '#fff' },
  customerInfo: { flex: 1, marginLeft: 14 },
  customerName: { fontSize: 17, fontWeight: '700', color: Colors.foreground },
  customerPhone: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
  callBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 177, 79, 0.12)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  messageBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  addressCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 18, marginBottom: 14, ...Shadows.small },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  addressIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 177, 79, 0.12)', alignItems: 'center', justifyContent: 'center' },
  addressTitle: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  addressText: { fontSize: 15, color: Colors.foreground, lineHeight: 22, marginBottom: 14 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0, 177, 79, 0.08)', borderRadius: BorderRadius.md, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(0, 177, 79, 0.2)' },
  directionsBtnText: { fontSize: 14, fontWeight: '600', color: '#00B14F' },
  itemsCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 18, marginBottom: 14, ...Shadows.small },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.foreground, marginBottom: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  itemQtyBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  itemName: { flex: 1, fontSize: 14, color: Colors.foreground },
  itemPrice: { fontSize: 14, fontWeight: '500', color: Colors.foreground },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  totalLabel: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  totalValue: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, padding: 12, marginTop: 12 },
  noteText: { flex: 1, fontSize: 13, color: Colors.mutedForeground, fontStyle: 'italic', lineHeight: 18 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#00B14F', borderRadius: BorderRadius.full, paddingVertical: 20, marginTop: 8, ...Shadows.large },
  completeBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
