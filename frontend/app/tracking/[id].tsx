import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import LiveMapView from '../../src/components/MapView';

const { width, height } = Dimensions.get('window');

const STATUS_CFG: Record<string, { label: string; color: string; icon: string; emoji: string }> = {
  confirmed: { label: 'Order Confirmed', color: '#6f4e37', icon: 'checkmark-circle', emoji: '✓' },
  preparing: { label: 'Preparing Your Order', color: '#8B5CF6', icon: 'cafe', emoji: '☕' },
  ready: { label: 'Ready for Pickup', color: '#10B981', icon: 'bag-check', emoji: '📦' },
  out_for_delivery: { label: 'On the Way!', color: '#1a73e8', icon: 'bicycle', emoji: '🛵' },
  delivered: { label: 'Delivered!', color: '#16a34a', icon: 'checkmark-done-circle', emoji: '✅' },
};

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 5000);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    return () => clearInterval(interval);
  }, [id]);

  const loadTracking = async () => {
    try {
      const data = await api.getTracking(id!);
      setTracking(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading || !tracking) {
    return <View style={s.loadingContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const cfg = STATUS_CFG[tracking.status] || STATUS_CFG.confirmed;
  const isDelivery = tracking.status === 'out_for_delivery';
  const isDelivered = tracking.status === 'delivered';
  const eta = tracking.estimated_delivery ? new Date(tracking.estimated_delivery) : null;
  const etaMin = eta ? Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000)) : null;

  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });

  return (
    <View style={s.container}>
      {/* Full-screen Map */}
      <LiveMapView
        shopLat={tracking.shop_lat || 11.5684}
        shopLng={tracking.shop_lng || 104.9210}
        deliveryLat={tracking.delivery_lat || 11.5564}
        deliveryLng={tracking.delivery_lng || 104.9282}
        driverLat={tracking.driver?.lat}
        driverLng={tracking.driver?.lng}
        status={tracking.status}
        style={s.map}
      />

      {/* Top Bar */}
      <View style={s.topBar}>
        <TouchableOpacity testID="tracking-back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <View style={s.orderIdPill}>
          <Text style={s.orderIdText}>{tracking.order_id}</Text>
        </View>
      </View>

      {/* Status Banner */}
      <View style={[s.statusBanner, { backgroundColor: cfg.color }]}>  
        <Text style={s.statusEmoji}>{cfg.emoji}</Text>
        <Text style={s.statusLabel}>{cfg.label}</Text>
        {etaMin !== null && !isDelivered && (
          <View style={s.etaPill}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={s.etaText}>{etaMin} min</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[s.bottomSheet, { transform: [{ translateY: sheetTranslate }] }]}>
        <View style={s.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false} style={s.sheetScroll}>
          {/* Driver Card */}
          {tracking.driver && (
            <View style={s.driverCard}>
              <View style={s.driverAvatar}>
                <Text style={s.driverAvatarText}>{tracking.driver.name?.[0] || 'D'}</Text>
              </View>
              <View style={s.driverInfo}>
                <Text style={s.driverName}>{tracking.driver.name}</Text>
                <Text style={s.driverVehicle}>{tracking.driver.vehicle} · {tracking.driver.plate}</Text>
              </View>
              <TouchableOpacity testID="call-driver-btn" style={s.phoneBtn}>
                <Ionicons name="call" size={20} color="#1a73e8" />
              </TouchableOpacity>
              <TouchableOpacity testID="chat-driver-btn" style={s.chatBtn}>
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Status Timeline */}
          <View style={s.timeline}>
            {tracking.steps?.map((step: any, idx: number) => {
              const isActive = step.completed && !(tracking.steps[idx + 1]?.completed);
              const isLast = idx === tracking.steps.length - 1;
              const stepCfg = STATUS_CFG[step.key] || STATUS_CFG.confirmed;
              return (
                <View key={step.key} style={s.timelineRow}>
                  <View style={s.timelineLeftCol}>
                    <View style={[
                      s.timelineDot,
                      step.completed && { backgroundColor: stepCfg.color, borderColor: stepCfg.color },
                      isActive && s.timelineDotActive,
                    ]}>
                      {step.completed && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    {!isLast && <View style={[s.timelineStem, step.completed && { backgroundColor: stepCfg.color }]} />}
                  </View>
                  <View style={s.timelineTextCol}>
                    <Text style={[s.timelineStepLabel, step.completed && { color: Colors.foreground, fontWeight: '600' }]}>{step.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Delivery Address */}
          <View style={s.addressRow}>
            <View style={s.addressIcon}>
              <Ionicons name="location" size={18} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.addressLabel}>Delivering to</Text>
              <Text style={s.addressValue}>{tracking.delivery_address}</Text>
            </View>
          </View>

          {/* Order Items Summary */}
          {tracking.items?.length > 0 && (
            <View style={s.itemsSummary}>
              <Text style={s.itemsTitle}>{tracking.items.length} item{tracking.items.length > 1 ? 's' : ''}</Text>
              <Text style={s.itemsTotal}>${tracking.total?.toFixed(2)}</Text>
            </View>
          )}

          {isDelivered && (
            <TouchableOpacity testID="reorder-btn" style={s.reorderBtn} onPress={() => router.replace('/(tabs)/home')}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={s.reorderText}>Order Again</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const SHEET_HEIGHT = height * 0.45;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ebe4' },
  loadingContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  topBar: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 36, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...Shadows.medium },
  orderIdPill: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, ...Shadows.small },
  orderIdText: { fontSize: 13, fontWeight: '700', color: Colors.foreground },

  statusBanner: {
    position: 'absolute', top: Platform.OS === 'ios' ? 106 : 88, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 16, gap: 10, zIndex: 10, ...Shadows.medium,
  },
  statusEmoji: { fontSize: 20 },
  statusLabel: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  etaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  etaText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    ...Shadows.large, zIndex: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  sheetScroll: { flex: 1, paddingHorizontal: 20 },

  driverCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f2f0ed' },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a73e8', alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: '700', color: Colors.foreground },
  driverVehicle: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
  phoneBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e8f0fe', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  chatBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },

  timeline: { paddingTop: 16, paddingBottom: 8 },
  timelineRow: { flexDirection: 'row', minHeight: 36 },
  timelineLeftCol: { width: 28, alignItems: 'center' },
  timelineDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#e0dcd7', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  timelineStem: { width: 2, flex: 1, backgroundColor: '#e0dcd7', marginVertical: 2 },
  timelineTextCol: { flex: 1, paddingLeft: 10, paddingBottom: 12, justifyContent: 'center' },
  timelineStepLabel: { fontSize: 14, color: Colors.mutedForeground },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f2f0ed' },
  addressIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent + '20', alignItems: 'center', justifyContent: 'center' },
  addressLabel: { fontSize: 11, color: Colors.mutedForeground },
  addressValue: { fontSize: 14, fontWeight: '500', color: Colors.foreground, marginTop: 1 },

  itemsSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f2f0ed' },
  itemsTitle: { fontSize: 14, color: Colors.mutedForeground },
  itemsTotal: { fontSize: 18, fontWeight: '700', color: Colors.primary },

  reorderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 50, paddingVertical: 16, marginTop: 8 },
  reorderText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
