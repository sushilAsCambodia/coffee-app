import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../src/context/CartContext';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1561522983-385a76fbb4cb?w=200';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const renderCartItem = ({ item }: { item: typeof items[0] }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.product_image || FALLBACK_IMAGE }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        {item.variants?.length > 0 && (
          <Text style={styles.itemDetails}>
            {item.variants.map(v => v.option_name).join(' · ')}
          </Text>
        )}
        {item.addons?.length > 0 && (
          <Text style={styles.itemAddons}>+ {item.addons.map(a => a.name).join(', ')}</Text>
        )}
        <Text style={styles.itemPrice}>${item.total_price.toFixed(2)}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity
          testID={`cart-minus-${item.cart_id}`}
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.cart_id, item.quantity - 1)}
        >
          <Ionicons
            name={item.quantity === 1 ? 'trash-outline' : 'remove'}
            size={16}
            color={item.quantity === 1 ? Colors.destructive : Colors.foreground}
          />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          testID={`cart-plus-${item.cart_id}`}
          style={styles.qtyBtn}
          onPress={() => updateQuantity(item.cart_id, item.quantity + 1)}
        >
          <Ionicons name="add" size={16} color={Colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity testID="clear-cart-btn" onPress={handleClearCart}>
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

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
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
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
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
