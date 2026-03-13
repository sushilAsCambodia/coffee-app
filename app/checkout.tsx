import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../src/context/CartContext';
import { useAuth } from '../src/context/AuthContext';
import { api, Address, ServiceMode } from '../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../src/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'cash',       name: 'Cash',       desc: 'Pay at counter',         icon: 'cash-outline'    },
  { id: 'static_qr',  name: 'KHQR / ABA', desc: 'Scan QR code to pay',    icon: 'qr-code-outline' },
] as const;

type PaymentMethodId = typeof PAYMENT_METHODS[number]['id'];

type ServiceModeOption = {
  id: ServiceMode;
  label: string;
  icon: string;
  desc: string;
};

const SERVICE_MODES: ServiceModeOption[] = [
  { id: 'takeaway', label: 'Takeaway',  icon: 'bag-handle-outline',   desc: 'Pick up at counter'     },
  { id: 'dine_in',  label: 'Dine In',   icon: 'restaurant-outline',   desc: 'Eat at the cafe'        },
  { id: 'delivery', label: 'Delivery',  icon: 'bicycle-outline',       desc: 'Delivered to your door' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();

  // Form state
  const [serviceMode, setServiceMode] = useState<ServiceMode>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');

  // Delivery address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [addrModalVisible, setAddrModalVisible] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Flow state
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [orderNumber, setOrderNumber] = useState('');

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
    }
  }, [user]);

  // Load saved addresses when delivery mode selected
  const loadAddresses = useCallback(async () => {
    if (addresses.length > 0) return;
    setLoadingAddresses(true);
    try {
      const data = await api.getAddresses();
      setAddresses(data);
      const def = data.find(a => a.is_default) || data[0];
      if (def) setSelectedAddress(def);
    } catch {
      // silently ignore — user can type manually
    } finally {
      setLoadingAddresses(false);
    }
  }, [addresses.length]);

  useEffect(() => {
    if (serviceMode === 'delivery') loadAddresses();
  }, [serviceMode, loadAddresses]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (items.length === 0) return 'Your cart is empty.';
    if (serviceMode === 'delivery') {
      const addr = selectedAddress?.address || customAddress.trim();
      if (!addr) return 'Please select or enter a delivery address.';
    }
    return null;
  };

  // ── Place Order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    const err = validate();
    if (err) { Alert.alert('Missing Info', err); return; }

    setStep('processing');
    try {
      const deliveryAddress = selectedAddress?.address || customAddress.trim() || undefined;
      const order = await api.createOrder({
        service_mode: serviceMode,
        payment_method: paymentMethod,
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        order_notes: note.trim() || undefined,
        delivery_address: serviceMode === 'delivery' ? deliveryAddress : undefined,
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
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (step === 'success') {
    const modeLabel = SERVICE_MODES.find(m => m.id === serviceMode)?.label || serviceMode;
    const isDelivery = serviceMode === 'delivery';
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSubtitle}>
            {isDelivery
              ? 'A driver will pick up and deliver your order'
              : serviceMode === 'dine_in'
                ? 'Your order will be prepared for your table'
                : 'Your coffee is being prepared for pickup'}
          </Text>
          <View style={styles.successBadge}>
            <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
            <Text style={styles.successOrderId}>{orderNumber}</Text>
          </View>
          <View style={styles.successModeBadge}>
            <Ionicons name={SERVICE_MODES.find(m => m.id === serviceMode)?.icon as any} size={14} color={Colors.mutedForeground} />
            <Text style={styles.successModeText}>{modeLabel}</Text>
          </View>
          <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace('/(tabs)/orders')} activeOpacity={0.85}>
            <Ionicons name="receipt-outline" size={20} color="#fff" />
            <Text style={styles.trackBtnText}>View My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.homeBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Processing Screen ───────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paymentContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.paymentProcessing}>Placing your order…</Text>
          <Text style={styles.paymentAmount}>${total.toFixed(2)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Details Screen ──────────────────────────────────────────────────────────
  const deliveryAddr = selectedAddress?.address || customAddress.trim();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── 1. Service Mode ── */}
          <View style={styles.section}>
            <SectionTitle icon="storefront-outline" title="Order Type" />
            <View style={styles.modeGrid}>
              {SERVICE_MODES.map(mode => {
                const active = serviceMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeCard, active && styles.modeCardActive]}
                    onPress={() => setServiceMode(mode.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.modeIconBox, active && styles.modeIconBoxActive]}>
                      <Ionicons name={mode.icon as any} size={22} color={active ? '#fff' : Colors.mutedForeground} />
                    </View>
                    <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{mode.label}</Text>
                    <Text style={styles.modeDesc}>{mode.desc}</Text>
                    {active && (
                      <View style={styles.modeCheck}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── 2. Delivery Address (only when delivery selected) ── */}
          {serviceMode === 'delivery' && (
            <View style={styles.section}>
              <SectionTitle icon="location-outline" title="Delivery Address" required />

              {loadingAddresses ? (
                <View style={styles.addrLoading}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.addrLoadingText}>Loading saved addresses…</Text>
                </View>
              ) : (
                <>
                  {/* Selected address display */}
                  <TouchableOpacity
                    style={[styles.addrPicker, !deliveryAddr && styles.addrPickerEmpty]}
                    onPress={() => setAddrModalVisible(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.addrPickerIcon}>
                      <Ionicons
                        name={deliveryAddr ? 'location' : 'location-outline'}
                        size={20}
                        color={deliveryAddr ? Colors.primary : Colors.mutedForeground}
                      />
                    </View>
                    <View style={styles.addrPickerText}>
                      {deliveryAddr ? (
                        <>
                          {selectedAddress && (
                            <Text style={styles.addrLabel}>{selectedAddress.label}</Text>
                          )}
                          <Text style={styles.addrValue}>{deliveryAddr}</Text>
                          {selectedAddress?.city && (
                            <Text style={styles.addrCity}>{selectedAddress.city}</Text>
                          )}
                        </>
                      ) : (
                        <Text style={styles.addrPlaceholder}>Select or enter a delivery address</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
                  </TouchableOpacity>

                  {/* Custom address input (shown when no saved selected or user wants to type) */}
                  {!selectedAddress && (
                    <View style={styles.customAddrWrap}>
                      <Text style={styles.customAddrOr}>— or type address manually —</Text>
                      <TextInput
                        style={styles.textInput}
                        value={customAddress}
                        onChangeText={setCustomAddress}
                        placeholder="Enter full delivery address"
                        placeholderTextColor={Colors.mutedForeground}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* ── 3. Customer Details ── */}
          <View style={styles.section}>
            <SectionTitle icon="person-outline" title="Your Details" />
            <View style={styles.fieldCard}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Your name"
                  placeholderTextColor={Colors.mutedForeground}
                />
              </View>
              <View style={[styles.fieldRow, styles.fieldRowBorder]}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="Your phone number"
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* ── 4. Order Summary ── */}
          <View style={styles.section}>
            <SectionTitle icon="receipt-outline" title="Order Summary" />
            <View style={styles.summaryCard}>
              {items.map(item => (
                <View key={item.cart_id} style={styles.summaryItem}>
                  <View style={styles.summaryQtyBadge}>
                    <Text style={styles.summaryQty}>{item.quantity}</Text>
                  </View>
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryName}>{item.name}</Text>
                    {item.variants?.length > 0 && (
                      <Text style={styles.summaryDetails}>{item.variants.map(v => v.option_name).join(' · ')}</Text>
                    )}
                    {item.addons?.length > 0 && (
                      <Text style={styles.summaryDetails}>+ {item.addons.map(a => a.name).join(', ')}</Text>
                    )}
                  </View>
                  <Text style={styles.summaryPrice}>${item.total_price.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ── 5. Payment Method ── */}
          <View style={styles.section}>
            <SectionTitle icon="card-outline" title="Payment Method" />
            {PAYMENT_METHODS.map(method => {
              const active = paymentMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.paymentOption, active && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod(method.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={method.icon as any} size={22} color={active ? Colors.primary : Colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paymentLabel, active && { color: Colors.primary }]}>{method.name}</Text>
                    <Text style={styles.paymentDesc}>{method.desc}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 6. Note ── */}
          <View style={styles.section}>
            <SectionTitle icon="chatbox-ellipses-outline" title="Order Note" />
            <TextInput
              style={[styles.textInput, { minHeight: 72, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="Any special instructions…"
              placeholderTextColor={Colors.mutedForeground}
              multiline
            />
          </View>

        </ScrollView>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalSub}>{SERVICE_MODES.find(m => m.id === serviceMode)?.label}</Text>
            </View>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.placeOrderBtn, items.length === 0 && styles.placeOrderBtnDisabled]}
            onPress={handlePlaceOrder}
            disabled={items.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.placeOrderText}>Place Order · ${total.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* ── Address Picker Modal ── */}
      <AddressPickerModal
        visible={addrModalVisible}
        addresses={addresses}
        selectedId={selectedAddress?.id}
        onSelect={(addr) => {
          setSelectedAddress(addr);
          setCustomAddress('');
          setAddrModalVisible(false);
        }}
        onManual={() => {
          setSelectedAddress(null);
          setAddrModalVisible(false);
        }}
        onAddNew={() => {
          setAddrModalVisible(false);
          router.push('/profile/address-form');
        }}
        onClose={() => setAddrModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Address Picker Modal ────────────────────────────────────────────────────

function AddressPickerModal({
  visible, addresses, selectedId, onSelect, onManual, onAddNew, onClose,
}: {
  visible: boolean;
  addresses: Address[];
  selectedId?: number;
  onSelect: (a: Address) => void;
  onManual: () => void;
  onAddNew: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Select Delivery Address</Text>

          {addresses.length === 0 ? (
            <View style={modalStyles.empty}>
              <Ionicons name="location-outline" size={40} color={Colors.mutedForeground} />
              <Text style={modalStyles.emptyText}>No saved addresses yet</Text>
            </View>
          ) : (
            <FlatList
              data={addresses}
              keyExtractor={item => String(item.id)}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => {
                const sel = item.id === selectedId;
                return (
                  <TouchableOpacity
                    style={[modalStyles.addrRow, sel && modalStyles.addrRowSelected]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[modalStyles.addrIcon, sel && modalStyles.addrIconSelected]}>
                      <Ionicons name="location-outline" size={18} color={sel ? '#fff' : Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={modalStyles.addrTopRow}>
                        <Text style={[modalStyles.addrLabel, sel && { color: Colors.primary }]}>{item.label}</Text>
                        {item.is_default && (
                          <View style={modalStyles.defaultBadge}>
                            <Text style={modalStyles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={modalStyles.addrValue}>{item.address}</Text>
                      {!!item.city && <Text style={modalStyles.addrCity}>{item.city}</Text>}
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.actionBtn} onPress={onManual} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
              <Text style={modalStyles.actionBtnText}>Enter Address Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.actionBtn, modalStyles.actionBtnSecondary]} onPress={onAddNew} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.foreground} />
              <Text style={[modalStyles.actionBtnText, { color: Colors.foreground }]}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────

function SectionTitle({ icon, title, required }: { icon: string; title: string; required?: boolean }) {
  return (
    <View style={stStyles.row}>
      <Ionicons name={icon as any} size={18} color={Colors.primary} />
      <Text style={stStyles.title}>{title}</Text>
      {required && <Text style={stStyles.required}>*</Text>}
    </View>
  );
}

const stStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground, flex: 1 },
  required: { fontSize: Typography.sm, fontWeight: '700', color: Colors.destructive },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },

  content: { padding: 16, paddingBottom: 24, gap: 4 },
  section: { marginBottom: 20 },

  // Service Mode
  modeGrid: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    position: 'relative', gap: 6,
  },
  modeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  modeIconBox: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  modeIconBoxActive: { backgroundColor: Colors.primary },
  modeLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.foreground, textAlign: 'center' },
  modeLabelActive: { color: Colors.primary },
  modeDesc: { fontSize: 10, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 14 },
  modeCheck: { position: 'absolute', top: 8, right: 8 },

  // Address Picker
  addrPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 14,
    borderWidth: 1.5, borderColor: Colors.primary, ...Shadows.small,
  },
  addrPickerEmpty: { borderColor: Colors.border, borderStyle: 'dashed' },
  addrPickerIcon: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  addrPickerText: { flex: 1 },
  addrLabel: { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  addrValue: { fontSize: Typography.sm, fontWeight: '500', color: Colors.foreground, lineHeight: 20 },
  addrCity: { fontSize: Typography.xs, color: Colors.mutedForeground },
  addrPlaceholder: { fontSize: Typography.sm, color: Colors.mutedForeground },
  addrLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: Colors.card, borderRadius: BorderRadius.lg },
  addrLoadingText: { fontSize: Typography.sm, color: Colors.mutedForeground },
  customAddrWrap: { marginTop: 12, gap: 8 },
  customAddrOr: { fontSize: Typography.xs, color: Colors.mutedForeground, textAlign: 'center' },

  // Customer details
  fieldCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  fieldRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  fieldLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.mutedForeground, width: 52 },
  fieldInput: { flex: 1, fontSize: Typography.base, color: Colors.foreground },

  // Summary
  summaryCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 16, ...Shadows.small },
  summaryItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  summaryQtyBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryQty: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },
  summaryDetails: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  summaryPrice: { fontSize: Typography.sm, fontWeight: '700', color: Colors.foreground },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryTotalLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  summaryTotalValue: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, marginBottom: 10,
    borderWidth: 1.5, borderColor: 'transparent', ...Shadows.small,
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  paymentLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  paymentDesc: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  textInput: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 14,
    fontSize: Typography.base, color: Colors.foreground,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.small,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: Colors.card, padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.large,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  grandTotalLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  grandTotalSub: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  grandTotalValue: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.primary },
  placeOrderBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', ...Shadows.medium,
  },
  placeOrderBtnDisabled: { opacity: 0.5 },
  placeOrderText: { color: '#fff', fontSize: Typography.base, fontWeight: '700' },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  successIconBg: { marginBottom: 8 },
  successTitle: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.foreground },
  successSubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  successBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full, marginTop: 8,
  },
  successOrderId: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
  successModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.muted, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  successModeText: { fontSize: Typography.xs, color: Colors.mutedForeground, fontWeight: '600' },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, paddingVertical: 15, paddingHorizontal: 32, marginTop: 24, ...Shadows.medium,
  },
  trackBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '700' },
  homeBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  homeBtnText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '600' },

  // Processing
  paymentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  paymentProcessing: { fontSize: Typography.lg, color: Colors.foreground, fontWeight: '600' },
  paymentAmount: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.primary },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground, marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: Typography.sm, color: Colors.mutedForeground },
  addrRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: BorderRadius.xl, marginBottom: 8, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  addrRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  addrIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  addrIconSelected: { backgroundColor: Colors.primary },
  addrTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  addrLabel: { fontSize: Typography.xs, fontWeight: '700', color: Colors.foreground, textTransform: 'uppercase', letterSpacing: 0.5 },
  addrValue: { fontSize: Typography.sm, color: Colors.foreground, lineHeight: 18 },
  addrCity: { fontSize: Typography.xs, color: Colors.mutedForeground },
  defaultBadge: { backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  defaultBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  actions: { marginTop: 16, gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.secondary, paddingVertical: 13, borderRadius: BorderRadius.xl,
  },
  actionBtnSecondary: { backgroundColor: Colors.muted },
  actionBtnText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
});
