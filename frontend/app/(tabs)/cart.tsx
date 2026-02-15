import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../src/constants/theme';

const PRODUCT_IMAGES: Record<string, string> = {
  latte: 'https://images.unsplash.com/photo-1561522983-385a76fbb4cb?w=200',
  cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200',
  americano: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=200',
  mocha: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=200',
  flatwhite: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=200',
  iced_latte: 'https://images.unsplash.com/photo-1695741996464-857c90c635c3?w=200',
  cold_brew: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200',
  frappe: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200',
  matcha: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=200',
  chai: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=200',
  hotchoc: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=200',
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=200',
  cheesecake: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=200',
};

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCart(); }, []));

  const updateQuantity = async (cartId: string, newQty: number) => {
    if (newQty < 1) {
      removeItem(cartId);
      return;
    }
    setUpdating(cartId);
    try {
      await api.updateCartItem(cartId, newQty);
      await loadCart();
    } catch (e) {
      Alert.alert('Error', 'Failed to update item');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartId: string) => {
    setUpdating(cartId);
    try {
      await api.deleteCartItem(cartId);
      await loadCart();
    } catch (e) {
      Alert.alert('Error', 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const product = item.product || {};
    const imgKey = product.image || 'latte';
    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: PRODUCT_IMAGES[imgKey] || PRODUCT_IMAGES.latte }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{product.name || 'Item'}</Text>
          <Text style={styles.itemDetails}>{item.size} · {item.sugar_level}</Text>
          {item.add_ons?.length > 0 && <Text style={styles.itemAddons}>+ {item.add_ons.join(', ')}</Text>}
          <Text style={styles.itemPrice}>${item.total_price?.toFixed(2)}</Text>
        </View>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            testID={`cart-minus-${item.cart_id}`}
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.cart_id, item.quantity - 1)}
            disabled={updating === item.cart_id}
          >
            <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color={item.quantity === 1 ? Colors.destructive : Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{updating === item.cart_id ? '...' : item.quantity}</Text>
          <TouchableOpacity
            testID={`cart-plus-${item.cart_id}`}
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.cart_id, item.quantity + 1)}
            disabled={updating === item.cart_id}
          >
            <Ionicons name="add" size={16} color={Colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const items = cart?.items || [];
  const total = cart?.total || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity testID="clear-cart-btn" onPress={async () => { await api.clearCart(); loadCart(); }}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={Colors.muted} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some delicious items to get started</Text>
          <TouchableOpacity testID="browse-btn" style={styles.browseBtn} onPress={() => router.push('/(tabs)/home')}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item.cart_id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>$1.50</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${(total + 1.5).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              testID="checkout-btn"
              style={styles.checkoutBtn}
              onPress={() => router.push('/checkout')}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={20} color={Colors.primaryForeground} />
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  clearText: { color: Colors.destructive, fontSize: Typography.sm, fontWeight: '500' },
  listContent: { paddingHorizontal: 20 },
  cartItem: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: 14, marginBottom: 12, ...Shadows.small, alignItems: 'center',
  },
  itemImage: { width: 68, height: 68, borderRadius: BorderRadius.md, backgroundColor: Colors.muted },
  itemInfo: { flex: 1, marginLeft: 14 },
  itemName: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  itemDetails: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  itemAddons: { fontSize: Typography.xs, color: Colors.accent, marginTop: 2 },
  itemPrice: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground, minWidth: 20, textAlign: 'center' },
  summary: {
    backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: 24, ...Shadows.large,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: Typography.sm, color: Colors.mutedForeground },
  summaryValue: { fontSize: Typography.sm, fontWeight: '500', color: Colors.foreground },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 20 },
  totalLabel: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  totalValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  checkoutBtn: {
    flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center', gap: 8, ...Shadows.small,
  },
  checkoutBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  emptySubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, textAlign: 'center' },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  browseBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
