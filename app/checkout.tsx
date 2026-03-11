import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../src/context/CartContext';
import { api } from '../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../src/constants/theme';

// Server auto-processes cash and static_qr payments immediately on order creation
const PAYMENT_METHODS = [
  { id: 'cash',       name: 'Cash',        icon: 'cash-outline'     },
  { id: 'static_qr',  name: 'KHQR / ABA',  icon: 'qr-code-outline'  },
] as const;

type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('cash');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [orderNumber, setOrderNumber] = useState('');

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before ordering');
      return;
    }
    setProcessing(true);
    setStep('processing');
    try {
      const order = await api.createOrder({
        customer_name: customerName.trim() || undefined,
        order_notes: note.trim() || undefined,
        service_mode: 'takeaway',
        payment_method: paymentMethod,
        items: items.map(item => ({
          menu_id: item.menu_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          variants: item.variants.map(v => ({
            variant_id: v.variant_id,
            variant_name: v.variant_name,
            option_id: v.option_id,
            option_name: v.option_name,
          })),
          addons: item.addons.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price,
          })),
        })),
      });

      setOrderNumber(order.order_number);
      clearCart();
      setStep('success');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to place order. Please try again.');
      setStep('details');
    } finally {
      setProcessing(false);
    }
  };

  // ── Success ──
  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>Your coffee is being prepared</Text>
          <Text style={styles.successOrderId}>{orderNumber}</Text>
          <TouchableOpacity
            testID="view-orders-btn"
            style={styles.trackBtn}
            onPress={() => router.replace('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Ionicons name="receipt-outline" size={20} color={Colors.primaryForeground} />
            <Text style={styles.trackBtnText}>View My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="back-home-btn"
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.homeBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Processing ──
  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paymentContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.paymentProcessing}>Processing Payment...</Text>
          <Text style={styles.paymentAmount}>${total.toFixed(2)}</Text>
          <Text style={styles.orderRef}>{orderNumber}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Details ──
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity testID="checkout-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Customer name (optional) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Your Name (optional)</Text>
            </View>
            <TextInput
              testID="name-input"
              style={styles.textInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter your name"
              placeholderTextColor={Colors.mutedForeground}
            />
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            {items.map(item => (
              <View key={item.cart_id} style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <Text style={styles.summaryQty}>{item.quantity}x</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryName}>{item.name}</Text>
                    {item.variants?.length > 0 && (
                      <Text style={styles.summaryDetails}>
                        {item.variants.map(v => v.option_name).join(' · ')}
                      </Text>
                    )}
                    {item.addons?.length > 0 && (
                      <Text style={styles.summaryDetails}>
                        + {item.addons.map(a => a.name).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.summaryPrice}>${item.total_price.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                testID={`payment-${method.id}`}
                key={method.id}
                style={[styles.paymentOption, paymentMethod === method.id && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={paymentMethod === method.id ? Colors.primary : Colors.mutedForeground}
                />
                <Text style={styles.paymentLabel}>{method.name}</Text>
                <View style={[styles.radio, paymentMethod === method.id && styles.radioActive]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Note (optional)</Text>
            </View>
            <TextInput
              testID="note-input"
              style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Any special instructions..."
              placeholderTextColor={Colors.mutedForeground}
              multiline
            />
          </View>
        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            testID="place-order-btn"
            style={[styles.placeOrderBtn, items.length === 0 && styles.placeOrderBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={processing || items.length === 0}
            activeOpacity={0.85}
          >
            {processing ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.placeOrderText}>Place Order · ${total.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground },
  textInput: {
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, padding: 16,
    fontSize: Typography.base, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border,
  },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10 },
  summaryItemLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  summaryQty: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary, width: 28 },
  summaryName: { fontSize: Typography.base, fontWeight: '500', color: Colors.foreground },
  summaryDetails: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  summaryPrice: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  paymentLabel: { flex: 1, fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  bottomBar: {
    backgroundColor: Colors.card, padding: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.large,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  grandTotalLabel: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  grandTotalValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  placeOrderBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', ...Shadows.medium,
  },
  placeOrderBtnDisabled: { opacity: 0.5 },
  placeOrderText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIconBg: { marginBottom: 24 },
  successTitle: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.foreground },
  successSubtitle: { fontSize: Typography.base, color: Colors.mutedForeground, marginTop: 8, textAlign: 'center' },
  successOrderId: {
    fontSize: Typography.sm, color: Colors.primary, fontWeight: '600', marginTop: 12,
    backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full,
  },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, paddingVertical: 16, paddingHorizontal: 32, marginTop: 32, ...Shadows.medium,
  },
  trackBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  homeBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24 },
  homeBtnText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '500' },
  // Processing
  paymentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  paymentProcessing: { fontSize: Typography.lg, color: Colors.foreground, fontWeight: '600' },
  paymentAmount: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.primary },
  orderRef: { fontSize: Typography.sm, color: Colors.mutedForeground },
});
