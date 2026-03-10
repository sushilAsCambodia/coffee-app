import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, Order, OrderStatus } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const { height } = Dimensions.get('window');
const SHEET_MIN = 300;
const SHEET_MAX = height * 0.72;

const STEPS: { key: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pending',   label: 'Order Received',   icon: 'receipt-outline'              },
  { key: 'preparing', label: 'Being Prepared',   icon: 'cafe-outline'                 },
  { key: 'ready',     label: 'Ready for Pickup', icon: 'bag-check-outline'            },
  { key: 'completed', label: 'Completed',        icon: 'checkmark-done-circle-outline'},
];

const STATUS_COLOR: Record<string, string> = {
  pending:   '#F59E0B',
  preparing: '#8B5CF6',
  ready:     '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'Order Received',
  preparing: 'Being Prepared',
  ready:     'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  pending:   'time-outline',
  preparing: 'cafe',
  ready:     'bag-check',
  completed: 'checkmark-done-circle',
  cancelled: 'close-circle',
};

function getStepIndex(status: string): number {
  return STEPS.findIndex(s => s.key === status);
}

export default function OrderTrackingScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const { id }    = useLocalSearchParams<{ id: string }>();

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const sheetHeight = useRef(new Animated.Value(SHEET_MIN)).current;
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getOrder(parseInt(id, 10));
      setOrder(data);
    } catch (e) {
      console.error('[tracking] error', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
    const iv = setInterval(loadOrder, 6000);
    return () => clearInterval(iv);
  }, [loadOrder]);

  const toggleSheet = () => {
    const toValue = expanded ? SHEET_MIN : SHEET_MAX;
    Animated.spring(sheetHeight, { toValue, useNativeDriver: false, tension: 60, friction: 10 }).start();
    setExpanded(e => !e);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.destructive} />
        <Text style={styles.loadingText}>Order not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCancelled    = order.status === 'cancelled';
  const isCompleted    = order.status === 'completed';
  const activeColor    = STATUS_COLOR[order.status] ?? Colors.primary;
  const currentStepIdx = getStepIndex(order.status);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.heroBg, { backgroundColor: activeColor + '18' }]} />

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <View style={styles.orderBadge}>
          <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
          <Text style={styles.orderBadgeText}>{order.order_number}</Text>
        </View>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Hero status icon */}
      <View style={styles.heroCenter}>
        <Animated.View style={[
          styles.bigIconWrap,
          { backgroundColor: activeColor, transform: [{ scale: pulseAnim }] },
        ]}>
          <Ionicons name={STATUS_ICON[order.status] ?? 'receipt'} size={52} color="#fff" />
        </Animated.View>

        <Text style={[styles.bigLabel, { color: activeColor }]}>
          {STATUS_LABEL[order.status] ?? order.status}
        </Text>

        {!isCompleted && !isCancelled && (
          <View style={[styles.liveChip, { backgroundColor: activeColor }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live updates</Text>
          </View>
        )}
      </View>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.handleWrap} onPress={toggleSheet} activeOpacity={0.9}>
          <View style={styles.handle} />
          <Text style={styles.handleLabel}>{expanded ? 'Collapse' : 'Show order details'}</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={expanded}
          contentContainerStyle={styles.sheetBody}
        >
          {/* Status timeline */}
          {!isCancelled && (
            <View style={styles.timeline}>
              {STEPS.map((step, idx) => {
                const done   = idx <= currentStepIdx;
                const active = idx === currentStepIdx;
                const clr    = done ? STATUS_COLOR[step.key] : '#D1D5DB';
                const isLast = idx === STEPS.length - 1;

                return (
                  <View key={step.key} style={styles.tRow}>
                    <View style={styles.tLeft}>
                      <View style={[
                        styles.tDot,
                        { borderColor: clr, backgroundColor: done ? clr : '#fff' },
                        active && styles.tDotActive,
                      ]}>
                        {done && <Ionicons name="checkmark" size={11} color="#fff" />}
                      </View>
                      {!isLast && <View style={[styles.tLine, { backgroundColor: done && !active ? clr : '#E5E7EB' }]} />}
                    </View>
                    <View style={styles.tRight}>
                      <Ionicons name={step.icon} size={16} color={done ? clr : '#9CA3AF'} />
                      <Text style={[styles.tLabel, done && { color: Colors.foreground }, active && { fontWeight: '700', color: clr }]}>
                        {step.label}
                      </Text>
                      {active && (
                        <View style={[styles.nowChip, { backgroundColor: clr + '22' }]}>
                          <Text style={[styles.nowText, { color: clr }]}>Now</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {isCancelled && (
            <View style={styles.cancelBanner}>
              <Ionicons name="close-circle" size={24} color={Colors.destructive} />
              <Text style={styles.cancelText}>This order was cancelled</Text>
            </View>
          )}

          {/* Items */}
          <Text style={styles.sectionTitle}>Order Items</Text>
          {(order.items ?? []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {(item as any).variants?.length > 0 && (
                  <Text style={styles.itemSub}>
                    {(item as any).variants.map((v: any) => v.option_name).join(' · ')}
                  </Text>
                )}
                {(item as any).addons?.length > 0 && (
                  <Text style={styles.itemSub}>
                    +{(item as any).addons.map((a: any) => a.name).join(', ')}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>
                ${(((item as any).unit_price ?? 0) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.sRow}>
              <Text style={styles.sLabel}>Subtotal</Text>
              <Text style={styles.sVal}>${order.subtotal?.toFixed(2)}</Text>
            </View>
            {order.tax > 0 && (
              <View style={styles.sRow}>
                <Text style={styles.sLabel}>Tax</Text>
                <Text style={styles.sVal}>${order.tax?.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.sRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>${order.total?.toFixed(2)}</Text>
            </View>
            <View style={[styles.sRow, { marginTop: 6 }]}>
              <Text style={styles.sLabel}>Payment</Text>
              <View style={[styles.payBadge, {
                backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
              }]}>
                <Ionicons
                  name={order.payment_status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                  size={13}
                  color={order.payment_status === 'paid' ? '#059669' : '#D97706'}
                />
                <Text style={[styles.payText, {
                  color: order.payment_status === 'paid' ? '#059669' : '#D97706',
                }]}>
                  {order.payment_method?.toUpperCase()} · {order.payment_status}
                </Text>
              </View>
            </View>
          </View>

          {isCompleted && (
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

          <TouchableOpacity style={styles.ordersLink} onPress={() => router.replace('/(tabs)/orders')}>
            <Text style={styles.ordersLinkText}>View all orders</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heroBg:    { ...StyleSheet.absoluteFillObject },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: Colors.background },
  loadingText: { fontSize: Typography.base, color: Colors.mutedForeground },
  goBackBtn:   { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  goBackText:  { color: Colors.primaryForeground, fontWeight: '600' },

  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  navBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.small },
  orderBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, ...Shadows.small },
  orderBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.foreground },

  heroCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: SHEET_MIN * 0.35 },
  bigIconWrap: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', ...Shadows.large },
  bigLabel:    { fontSize: Typography['2xl'], fontWeight: '800' },
  liveChip:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full },
  liveDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  liveText:    { fontSize: Typography.xs, fontWeight: '700', color: '#fff' },

  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, ...Shadows.large },
  handleWrap:  { alignItems: 'center', paddingTop: 14, paddingBottom: 4 },
  handle:      { width: 42, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0' },
  handleLabel: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 6 },
  sheetBody:   { paddingHorizontal: 20, paddingBottom: 24 },

  timeline: { paddingVertical: 12, marginBottom: 8 },
  tRow:     { flexDirection: 'row', minHeight: 48 },
  tLeft:    { width: 34, alignItems: 'center' },
  tDot:     { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tDotActive: { width: 28, height: 28, borderRadius: 14, borderWidth: 3, borderColor: '#fff', ...Shadows.small },
  tLine:    { width: 2, flex: 1, marginVertical: 4 },
  tRight:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingBottom: 18 },
  tLabel:   { flex: 1, fontSize: Typography.sm, color: '#9CA3AF' },
  nowChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  nowText:  { fontSize: Typography.xs, fontWeight: '700' },

  cancelBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#FEF2F2', borderRadius: BorderRadius.md, marginBottom: 16 },
  cancelText:   { fontSize: Typography.base, color: Colors.destructive, fontWeight: '600' },

  sectionTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground, marginBottom: 10 },
  itemRow:   { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  itemQty:   { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary, width: 26 },
  itemName:  { fontSize: Typography.sm, fontWeight: '500', color: Colors.foreground },
  itemSub:   { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  itemPrice: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },

  summaryCard: { backgroundColor: Colors.muted, borderRadius: BorderRadius.lg, padding: 16, marginTop: 16, marginBottom: 16 },
  sRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sLabel:      { fontSize: Typography.sm, color: Colors.mutedForeground },
  sVal:        { fontSize: Typography.sm, color: Colors.foreground, fontWeight: '500' },
  totalRow:    { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel:  { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  totalVal:    { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary },
  payBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  payText:     { fontSize: Typography.xs, fontWeight: '700' },

  reorderBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16, marginBottom: 12, ...Shadows.medium },
  reorderText:  { fontSize: Typography.base, fontWeight: '700', color: Colors.primaryForeground },
  ordersLink:   { alignItems: 'center', paddingVertical: 12 },
  ordersLinkText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '500' },
});
