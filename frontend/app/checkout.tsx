import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../src/constants/theme';

export default function CheckoutScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [address, setAddress] = useState('#123, Street 240, Phnom Penh, Cambodia');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }
    setProcessing(true);
    try {
      const order = await api.createOrder({
        delivery_address: address.trim(),
        payment_method: 'aba_payway',
        note: note.trim(),
      });
      setOrderId(order.order_id);
      setStep('payment');
      
      // Initiate mock payment
      const payment = await api.initiatePayment({ order_id: order.order_id, method: paymentMethod });
      
      // Simulate payment processing
      setTimeout(async () => {
        try {
          await api.confirmPayment(payment.payment_id);
          setStep('success');
        } catch (e) {
          Alert.alert('Payment Issue', 'Payment could not be confirmed. Please try again.');
          setStep('details');
        }
      }, 2500);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const items = cart?.items || [];
  const subtotal = cart?.total || 0;
  const deliveryFee = 1.50;
  const total = subtotal + deliveryFee;

  // Success Screen
  if (step === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>Your coffee is being prepared with love</Text>
          <Text style={styles.successOrderId}>{orderId}</Text>
          
          <TouchableOpacity
            testID="track-order-btn"
            style={styles.trackBtn}
            onPress={() => router.replace(`/tracking/${orderId}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="location-outline" size={20} color={Colors.primaryForeground} />
            <Text style={styles.trackBtnText}>Track My Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity testID="back-home-btn" style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.homeBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Payment Processing Screen
  if (step === 'payment') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paymentContainer}>
          <View style={styles.abaLogo}>
            <Text style={styles.abaText}>ABA</Text>
            <Text style={styles.payWayText}>PayWay</Text>
          </View>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          <Text style={styles.paymentProcessing}>Processing Payment...</Text>
          <Text style={styles.paymentAmount}>${total.toFixed(2)}</Text>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code-outline" size={100} color={Colors.primary} />
            <Text style={styles.qrText}>Scan to Pay</Text>
          </View>
          <Text style={styles.mockText}>Mock ABA PayWay - Auto confirming...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity testID="checkout-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Delivery Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TextInput
              testID="address-input"
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your delivery address"
              placeholderTextColor={Colors.mutedForeground}
              multiline
            />
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            {items.map((item: any) => (
              <View key={item.cart_id} style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <Text style={styles.summaryQty}>{item.quantity}x</Text>
                  <View>
                    <Text style={styles.summaryName}>{item.product?.name || 'Item'}</Text>
                    <Text style={styles.summaryDetails}>{item.size} · {item.sugar_level}</Text>
                  </View>
                </View>
                <Text style={styles.summaryPrice}>${item.total_price?.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            <TouchableOpacity
              testID="payment-qr"
              style={[styles.paymentOption, paymentMethod === 'qr' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('qr')}
            >
              <Ionicons name="qr-code-outline" size={24} color={paymentMethod === 'qr' ? Colors.primary : Colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>ABA QR Payment</Text>
                <Text style={styles.paymentDesc}>Scan QR code to pay</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'qr' && styles.radioActive]} />
            </TouchableOpacity>
            <TouchableOpacity
              testID="payment-card"
              style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <Ionicons name="card-outline" size={24} color={paymentMethod === 'card' ? Colors.primary : Colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Card Payment</Text>
                <Text style={styles.paymentDesc}>Visa, Mastercard, UnionPay</Text>
              </View>
              <View style={[styles.radio, paymentMethod === 'card' && styles.radioActive]} />
            </TouchableOpacity>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Note (optional)</Text>
            </View>
            <TextInput
              testID="note-input"
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Any special instructions..."
              placeholderTextColor={Colors.mutedForeground}
              multiline
            />
          </View>
        </ScrollView>

        {/* Bottom */}
        <View style={styles.bottomBar}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalLabel}>Delivery</Text>
              <Text style={styles.grandTotalLabel}>Total</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              <Text style={styles.totalValue}>${deliveryFee.toFixed(2)}</Text>
              <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity
            testID="place-order-btn"
            style={styles.placeOrderBtn}
            onPress={handlePlaceOrder}
            disabled={processing}
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
  addressInput: {
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, padding: 16,
    fontSize: Typography.base, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border,
    minHeight: 60, textAlignVertical: 'top',
  },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  summaryQty: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary, width: 28 },
  summaryName: { fontSize: Typography.base, fontWeight: '500', color: Colors.foreground },
  summaryDetails: { fontSize: Typography.xs, color: Colors.mutedForeground },
  summaryPrice: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  paymentLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  paymentDesc: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  noteInput: {
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, padding: 16,
    fontSize: Typography.base, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border,
    minHeight: 60, textAlignVertical: 'top',
  },
  bottomBar: {
    backgroundColor: Colors.card, padding: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.large,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: Typography.sm, color: Colors.mutedForeground, marginBottom: 4 },
  totalValue: { fontSize: Typography.sm, color: Colors.foreground, marginBottom: 4, fontWeight: '500' },
  grandTotalLabel: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground, marginTop: 4 },
  grandTotalValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  placeOrderBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', ...Shadows.medium,
  },
  placeOrderText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  // Success styles
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIconBg: { marginBottom: 24 },
  successTitle: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.foreground },
  successSubtitle: { fontSize: Typography.base, color: Colors.mutedForeground, marginTop: 8, textAlign: 'center' },
  successOrderId: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600', marginTop: 12, backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, paddingVertical: 16, paddingHorizontal: 32, marginTop: 32,
    ...Shadows.medium,
  },
  trackBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  homeBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24 },
  homeBtnText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '500' },
  // Payment processing
  paymentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  abaLogo: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  abaText: { fontSize: 36, fontWeight: '900', color: '#003366' },
  payWayText: { fontSize: 18, fontWeight: '600', color: Colors.accent },
  paymentProcessing: { fontSize: Typography.lg, color: Colors.foreground, fontWeight: '600', marginTop: 20 },
  paymentAmount: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.primary, marginTop: 8 },
  qrPlaceholder: { alignItems: 'center', marginTop: 32, padding: 32, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, ...Shadows.medium },
  qrText: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 12 },
  mockText: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 24, fontStyle: 'italic' },
});
