import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  confirmed: { label: 'Order Confirmed', color: Colors.primary, icon: 'checkmark-circle' },
  preparing: { label: 'Preparing', color: '#8B5CF6', icon: 'cafe' },
  out_for_delivery: { label: 'On the Way', color: '#3B82F6', icon: 'bicycle' },
  delivered: { label: 'Delivered', color: Colors.success, icon: 'checkmark-done-circle' },
};

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const driverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 10000);
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Driver movement animation
    Animated.loop(
      Animated.timing(driverAnim, { toValue: 1, duration: 8000, useNativeDriver: true })
    ).start();

    return () => clearInterval(interval);
  }, [id]);

  const loadTracking = async () => {
    try {
      const data = await api.getTracking(id!);
      setTracking(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !tracking) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[tracking.status] || STATUS_CONFIG.confirmed;
  const isDelivery = tracking.status === 'out_for_delivery';
  const isDelivered = tracking.status === 'delivered';

  const driverTranslateX = driverAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, (width - 120) * 0.6, (width - 120) * 0.8],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity testID="tracking-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <Text style={styles.orderId}>{tracking.order_id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Area - Simulated */}
        <View style={styles.mapContainer}>
          <View style={styles.mapBg}>
            {/* Grid lines to simulate map */}
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <View key={`h-${i}`} style={[styles.mapLine, { top: `${i * 16.6}%` }]} />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <View key={`v-${i}`} style={[styles.mapLineV, { left: `${i * 16.6}%` }]} />
            ))}
            
            {/* Route path */}
            <View style={styles.routePath} />

            {/* Shop marker */}
            <View style={[styles.marker, styles.shopMarker]}>
              <Ionicons name="cafe" size={18} color={Colors.primaryForeground} />
            </View>

            {/* Delivery marker */}
            <View style={[styles.marker, styles.deliveryMarker]}>
              <Ionicons name="home" size={18} color={Colors.primaryForeground} />
            </View>

            {/* Driver marker (animated) */}
            {isDelivery && (
              <Animated.View style={[styles.driverMarkerContainer, { transform: [{ translateX: driverTranslateX }] }]}>
                <Animated.View style={[styles.driverPulse, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.driverMarker}>
                  <Ionicons name="bicycle" size={20} color="#fff" />
                </View>
              </Animated.View>
            )}

            {/* Status overlay */}
            <View style={styles.mapOverlay}>
              <View style={[styles.statusChip, { backgroundColor: statusConfig.color }]}>
                <Ionicons name={statusConfig.icon as any} size={16} color="#fff" />
                <Text style={styles.statusChipText}>{statusConfig.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ETA Card */}
        {tracking.estimated_delivery && !isDelivered && (
          <View style={styles.etaCard}>
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <View>
              <Text style={styles.etaLabel}>Estimated Delivery</Text>
              <Text style={styles.etaTime}>
                {new Date(tracking.estimated_delivery).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}

        {/* Driver Card */}
        {tracking.driver && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={24} color={Colors.primaryForeground} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{tracking.driver.name}</Text>
              <Text style={styles.driverVehicle}>{tracking.driver.vehicle} · {tracking.driver.plate}</Text>
            </View>
            <TouchableOpacity testID="call-driver-btn" style={styles.callBtn}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Status Timeline */}
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Order Status</Text>
          {tracking.steps?.map((step: any, idx: number) => {
            const isLast = idx === (tracking.steps?.length || 0) - 1;
            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, step.completed && styles.timelineDotActive]}>
                    {step.completed && <Ionicons name="checkmark" size={12} color={Colors.primaryForeground} />}
                  </View>
                  {!isLast && <View style={[styles.timelineLine, step.completed && styles.timelineLineActive]} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, step.completed && styles.timelineLabelActive]}>{step.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.addressCard}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Delivery To</Text>
            <Text style={styles.addressText}>{tracking.delivery_address}</Text>
          </View>
        </View>

        {/* Order Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Order Total</Text>
          <Text style={styles.totalValue}>${tracking.total?.toFixed(2)}</Text>
        </View>

        {isDelivered && (
          <TouchableOpacity testID="reorder-btn" style={styles.reorderBtn} onPress={() => router.replace('/(tabs)/home')}>
            <Ionicons name="refresh" size={20} color={Colors.primaryForeground} />
            <Text style={styles.reorderText}>Order Again</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  orderId: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '600', backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  mapContainer: { marginHorizontal: 20, marginTop: 8, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.medium },
  mapBg: {
    height: 220, backgroundColor: '#e8e0d4', position: 'relative', overflow: 'hidden',
  },
  mapLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(111,78,55,0.08)' },
  mapLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(111,78,55,0.08)' },
  routePath: {
    position: 'absolute', top: '50%', left: 40, right: 40, height: 3,
    backgroundColor: Colors.primary, borderRadius: 2, opacity: 0.4,
  },
  marker: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', ...Shadows.small,
  },
  shopMarker: { backgroundColor: Colors.primary, top: '42%', left: 30 },
  deliveryMarker: { backgroundColor: Colors.accent, top: '42%', right: 30 },
  driverMarkerContainer: { position: 'absolute', top: '34%', left: 40 },
  driverPulse: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25, left: -7, top: -7,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  driverMarker: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center', ...Shadows.medium,
  },
  mapOverlay: { position: 'absolute', top: 12, left: 12 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: BorderRadius.full, ...Shadows.small,
  },
  statusChipText: { color: '#fff', fontSize: Typography.xs, fontWeight: '600' },
  etaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.card,
    marginHorizontal: 20, marginTop: 16, padding: 16, borderRadius: BorderRadius.lg, ...Shadows.small,
  },
  etaLabel: { fontSize: Typography.xs, color: Colors.mutedForeground },
  etaTime: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    marginHorizontal: 20, marginTop: 12, padding: 16, borderRadius: BorderRadius.lg, ...Shadows.small,
  },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  driverInfo: { flex: 1, marginLeft: 14 },
  driverName: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  driverVehicle: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  timeline: { marginHorizontal: 20, marginTop: 24 },
  timelineTitle: { fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, marginBottom: 16 },
  timelineItem: { flexDirection: 'row', minHeight: 48 },
  timelineLeft: { alignItems: 'center', width: 30 },
  timelineDot: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card,
  },
  timelineDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.muted, marginVertical: 2 },
  timelineLineActive: { backgroundColor: Colors.primary },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineLabel: { fontSize: Typography.base, color: Colors.mutedForeground },
  timelineLabelActive: { color: Colors.foreground, fontWeight: '600' },
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.card,
    marginHorizontal: 20, marginTop: 20, padding: 16, borderRadius: BorderRadius.lg, ...Shadows.small,
  },
  addressLabel: { fontSize: Typography.xs, color: Colors.mutedForeground },
  addressText: { fontSize: Typography.base, color: Colors.foreground, fontWeight: '500', marginTop: 2 },
  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginTop: 12, padding: 16, backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg, ...Shadows.small,
  },
  totalLabel: { fontSize: Typography.base, color: Colors.mutedForeground },
  totalValue: { fontSize: Typography.xl, fontWeight: '700', color: Colors.primary },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, marginHorizontal: 20, marginTop: 24,
    borderRadius: BorderRadius.full, paddingVertical: 16, ...Shadows.medium,
  },
  reorderText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
