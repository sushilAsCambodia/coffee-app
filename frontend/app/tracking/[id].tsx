import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated,
  Platform, ActivityIndicator, ScrollView, Linking, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import GrabStyleMap from '../../src/components/GrabStyleMap';

const { width, height } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = 260;
const SHEET_MAX_HEIGHT = height * 0.55;

interface TrackingData {
  order_id: string;
  status: string;
  steps: { key: string; label: string; completed: boolean }[];
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
    lat: number;
    lng: number;
    picture?: string;
  };
  estimated_delivery?: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  shop_lat: number;
  shop_lng: number;
  total: number;
  items: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap; bgColor: string }> = {
  pending_payment: { label: 'Awaiting Payment', color: '#F59E0B', icon: 'card-outline', bgColor: '#FEF3C7' },
  confirmed: { label: 'Order Confirmed', color: '#6f4e37', icon: 'checkmark-circle', bgColor: '#F5F0EB' },
  preparing: { label: 'Being Prepared', color: '#8B5CF6', icon: 'cafe', bgColor: '#EDE9FE' },
  ready: { label: 'Ready for Pickup', color: '#10B981', icon: 'bag-check', bgColor: '#D1FAE5' },
  out_for_delivery: { label: 'On the Way!', color: '#00B14F', icon: 'bicycle', bgColor: '#D1FAE5' },
  delivered: { label: 'Delivered!', color: '#059669', icon: 'checkmark-done-circle', bgColor: '#D1FAE5' },
};

export default function GrabStyleTracking() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for status
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const loadTracking = useCallback(async () => {
    try {
      const data = await api.getTracking(id!);
      setTracking(data);
    } catch (e) {
      console.error('Tracking error:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTracking();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadTracking, 5000);
    return () => clearInterval(interval);
  }, [loadTracking]);

  const toggleSheet = () => {
    const toValue = expanded ? SHEET_MIN_HEIGHT : SHEET_MAX_HEIGHT;
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      tension: 65,
      friction: 10,
    }).start();
    setExpanded(!expanded);
  };

  const handleCall = () => {
    if (tracking?.driver?.phone) {
      Linking.openURL(`tel:${tracking.driver.phone}`);
    }
  };

  if (loading || !tracking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your order...</Text>
      </SafeAreaView>
    );
  }

  const config = STATUS_CONFIG[tracking.status] || STATUS_CONFIG.confirmed;
  const isOutForDelivery = tracking.status === 'out_for_delivery';
  const isDelivered = tracking.status === 'delivered';
  
  // Calculate ETA
  const eta = tracking.estimated_delivery ? new Date(tracking.estimated_delivery) : null;
  const etaMinutes = eta ? Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000)) : null;

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <GrabStyleMap
        shopLat={tracking.shop_lat}
        shopLng={tracking.shop_lng}
        deliveryLat={tracking.delivery_lat}
        deliveryLng={tracking.delivery_lng}
        driverLat={tracking.driver?.lat}
        driverLng={tracking.driver?.lng}
        status={tracking.status}
        onMapReady={() => setMapReady(true)}
      />

      {/* Top Navigation Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity
          testID="back-btn"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{tracking.order_id}</Text>
        </View>

        <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
          <Ionicons name="help-circle-outline" size={22} color={Colors.foreground} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Status Banner - Grab Style */}
      <View style={[styles.statusBanner, { backgroundColor: config.color }]}>
        <View style={styles.statusLeft}>
          <Animated.View style={[styles.statusIconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name={config.icon} size={24} color="#fff" />
          </Animated.View>
          <View>
            <Text style={styles.statusLabel}>{config.label}</Text>
            {isOutForDelivery && tracking.driver && (
              <Text style={styles.statusSub}>{tracking.driver.name} is bringing your order</Text>
            )}
          </View>
        </View>
        {etaMinutes !== null && !isDelivered && (
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.etaText}>{etaMinutes} min</Text>
          </View>
        )}
      </View>

      {/* Bottom Sheet - Grab Style */}
      <Animated.View style={[styles.bottomSheet, { height: sheetHeight }]}>
        {/* Handle */}
        <TouchableOpacity
          testID="sheet-handle"
          style={styles.sheetHandleArea}
          onPress={toggleSheet}
          activeOpacity={0.9}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetToggleText}>
            {expanded ? 'Tap to collapse' : 'Tap for details'}
          </Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sheetContent}
          scrollEnabled={expanded}
        >
          {/* Driver Card - Show when out for delivery */}
          {tracking.driver && isOutForDelivery && (
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                {tracking.driver.picture ? (
                  <Image source={{ uri: tracking.driver.picture }} style={styles.driverImage} />
                ) : (
                  <Text style={styles.driverInitial}>
                    {tracking.driver.name?.charAt(0) || 'D'}
                  </Text>
                )}
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{tracking.driver.name}</Text>
                <Text style={styles.driverVehicle}>
                  {tracking.driver.vehicle} • {tracking.driver.plate}
                </Text>
              </View>
              <TouchableOpacity
                testID="call-driver-btn"
                style={styles.actionBtn}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={20} color="#00B14F" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Order Timeline */}
          <View style={styles.timeline}>
            {tracking.steps.map((step, idx) => {
              const isActive = step.completed && !tracking.steps[idx + 1]?.completed;
              const stepConfig = STATUS_CONFIG[step.key] || STATUS_CONFIG.confirmed;
              const isLast = idx === tracking.steps.length - 1;
              
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      step.completed && { backgroundColor: stepConfig.color, borderColor: stepConfig.color },
                      isActive && styles.timelineDotActive,
                    ]}>
                      {step.completed && (
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      )}
                    </View>
                    {!isLast && (
                      <View style={[
                        styles.timelineLine,
                        step.completed && { backgroundColor: stepConfig.color },
                      ]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineLabel,
                      step.completed && styles.timelineLabelActive,
                      isActive && { color: stepConfig.color, fontWeight: '700' },
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Delivery Address */}
          <View style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={20} color="#00B14F" />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressTitle}>Delivering to</Text>
              <Text style={styles.addressText}>{tracking.delivery_address}</Text>
            </View>
          </View>

          {/* Order Summary */}
          {tracking.items.length > 0 && (
            <View style={styles.orderSummary}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>
                  {tracking.items.length} item{tracking.items.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.summaryTotal}>${tracking.total?.toFixed(2)}</Text>
              </View>
              {expanded && tracking.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{item.quantity}x</Text>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemPrice}>${item.total_price?.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reorder Button */}
          {isDelivered && (
            <TouchableOpacity
              testID="reorder-btn"
              style={styles.reorderBtn}
              onPress={() => router.replace('/(tabs)/home')}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.reorderText}>Order Again</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E4E0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: Typography.base,
    color: Colors.mutedForeground,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 12,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  orderBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...Shadows.small,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
    letterSpacing: 0.3,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },

  // Status Banner
  statusBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    zIndex: 90,
    ...Shadows.large,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statusSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Shadows.large,
    zIndex: 200,
  },
  sheetHandleArea: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  sheetToggleText: {
    fontSize: 11,
    color: Colors.mutedForeground,
    marginTop: 6,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#00B14F',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  driverImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  driverInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00B14F',
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.foreground,
  },
  driverVehicle: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginTop: 3,
  },
  actionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // Timeline
  timeline: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 40,
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: '#fff',
    ...Shadows.medium,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  timelineLabelActive: {
    color: Colors.foreground,
    fontWeight: '600',
  },

  // Address Card
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addressIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 177, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  addressText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.foreground,
    marginTop: 2,
  },

  // Order Summary
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: Colors.foreground,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.foreground,
  },

  // Reorder Button
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#00B14F',
    borderRadius: 50,
    paddingVertical: 18,
    marginTop: 8,
    ...Shadows.medium,
  },
  reorderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
