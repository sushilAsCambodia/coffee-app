import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart, SelectedVariant, SelectedAddon } from '../../src/context/CartContext';
import { getProductById } from '../../src/utils/productCache';
import { api, Menu, Variant, VariantOption, AddOn } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1561522983-385a76fbb4cb?w=600';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  // Selections — one option per "single" variant group, multi for "multiple"
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    // Try cache first
    const cached = id ? getProductById(id) : null;
    if (cached) {
      setProduct(cached);
      initDefaults(cached);
      setLoading(false);
      return;
    }

    // Fallback: scan all categories to find the menu
    try {
      const cats = await api.getCategories();
      for (const cat of cats) {
        const menus = await api.getMenusByCategory(cat.id);
        const found = menus.find(m => String(m.id) === id);
        if (found) {
          const enriched = { ...found, category_name: cat.name, category_id: cat.id };
          setProduct(enriched);
          initDefaults(enriched);
          return;
        }
      }
      Alert.alert('Error', 'Product not found');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to load product');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const initDefaults = (p: Menu) => {
    // Pre-select the first option for every "single" variant group
    const defaults: Record<number, number[]> = {};
    p.variants?.forEach(v => {
      if (v.type === 'single' && v.options?.length > 0) {
        defaults[v.id] = [v.options[0].id];
      } else {
        defaults[v.id] = [];
      }
    });
    setSelectedOptions(defaults);
  };

  const toggleOption = (variant: Variant, option: VariantOption) => {
    setSelectedOptions(prev => {
      const current = prev[variant.id] || [];
      if (variant.type === 'single') {
        return { ...prev, [variant.id]: [option.id] };
      }
      // multiple
      return {
        ...prev,
        [variant.id]: current.includes(option.id)
          ? current.filter(id => id !== option.id)
          : [...current, option.id],
      };
    });
  };

  const toggleAddon = (addon: AddOn) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) return prev.filter(a => a.id !== addon.id);
      return [...prev, { id: addon.id, name: addon.name, price: addon.price }];
    });
  };

  const calculatePrice = () => {
    if (!product) return 0;
    const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
    const base = product.has_active_promotion && product.discounted_price != null
      ? product.discounted_price
      : product.base_price;
    return parseFloat(((base + addonTotal) * quantity).toFixed(2));
  };

  const handleAddToCart = () => {
    if (!product) return;

    const variantSelections: SelectedVariant[] = [];
    product.variants?.forEach(v => {
      const chosen = selectedOptions[v.id] || [];
      chosen.forEach(optId => {
        const opt = v.options.find(o => o.id === optId);
        if (opt) {
          variantSelections.push({
            variant_id: v.id,
            variant_name: v.name,
            option_id: opt.id,
            option_name: opt.name,
          });
        }
      });
    });

    const base = product.has_active_promotion && product.discounted_price != null
      ? product.discounted_price
      : product.base_price;
    const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
    const unit_price = parseFloat((base + addonTotal).toFixed(2));

    addItem({
      menu_id: product.id,
      name: product.name,
      quantity,
      unit_price,
      product_image: product.product_image || FALLBACK_IMAGE,
      category: product.category_name,
      description: product.description,
      sku: product.sku,
      type: product.type,
      variants: variantSelections,
      addons: selectedAddons,
    });

    Alert.alert('Added!', `${product.name} added to cart`, [
      { text: 'Continue Shopping', onPress: () => router.back() },
      { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
    ]);
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const totalPrice = calculatePrice();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity testID="product-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.product_image || FALLBACK_IMAGE }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {product.has_active_promotion && (
            <View style={styles.promoBanner}>
              <Ionicons name="pricetag" size={14} color={Colors.primaryForeground} />
              <Text style={styles.promoLabel}>
                {product.active_promotion?.discount_type === 'percentage'
                  ? `${product.active_promotion.discount_value}% OFF`
                  : `$${product.active_promotion?.discount_value} OFF`}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.category_name && (
            <Text style={styles.categoryLabel}>{product.category_name}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceMain}>
              ${(product.has_active_promotion && product.discounted_price != null
                ? product.discounted_price
                : product.base_price
              ).toFixed(2)}
            </Text>
            {product.has_active_promotion && (
              <Text style={styles.priceOriginal}>${product.base_price.toFixed(2)}</Text>
            )}
          </View>
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}
          {product.stock_quantity !== null && product.stock_quantity <= (product.low_stock_threshold ?? 5) && (
            <View style={styles.stockWarning}>
              <Ionicons name="warning-outline" size={14} color="#F59E0B" />
              <Text style={styles.stockText}>Only {product.stock_quantity} left</Text>
            </View>
          )}
        </View>

        {/* Variants */}
        {product.variants?.map(variant => (
          <View key={variant.id} style={styles.optionSection}>
            <Text style={styles.optionTitle}>
              {variant.name}
              {variant.type === 'multiple' && <Text style={styles.optionHint}> (choose any)</Text>}
            </Text>
            <View style={styles.optionRow}>
              {variant.options.map(option => {
                const chosen = (selectedOptions[variant.id] || []).includes(option.id);
                return (
                  <TouchableOpacity
                    testID={`variant-${variant.id}-${option.id}`}
                    key={option.id}
                    style={[styles.optionChip, chosen && styles.optionChipActive]}
                    onPress={() => toggleOption(variant, option)}
                  >
                    <Text style={[styles.optionChipText, chosen && styles.optionChipTextActive]}>
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Add-ons */}
        {product.add_ons?.length > 0 && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Add-ons</Text>
            {product.add_ons.map(addon => {
              const isSelected = selectedAddons.some(a => a.id === addon.id);
              return (
                <TouchableOpacity
                  testID={`addon-${addon.id}`}
                  key={addon.id}
                  style={[styles.addonItem, isSelected && styles.addonItemActive]}
                  onPress={() => toggleAddon(addon)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={Colors.primaryForeground} />}
                  </View>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>+${addon.price.toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            testID="qty-minus"
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            testID="qty-plus"
            style={styles.qtyBtn}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          testID="add-to-cart-btn"
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Ionicons name="cart-outline" size={20} color={Colors.primaryForeground} />
          <Text style={styles.addToCartText}>Add · ${totalPrice.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, textAlign: 'center' },
  scrollContent: { paddingBottom: 20 },
  imageContainer: { marginHorizontal: 20, marginTop: 8, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.muted },
  productImage: { width: '100%', height: 250 },
  promoBanner: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full,
  },
  promoLabel: { color: Colors.primaryForeground, fontSize: Typography.xs, fontWeight: '700' },
  infoCard: { paddingHorizontal: 20, paddingTop: 20 },
  productName: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  categoryLabel: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  priceMain: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.primary },
  priceOriginal: { fontSize: Typography.base, color: Colors.mutedForeground, textDecorationLine: 'line-through' },
  description: { fontSize: Typography.base, color: Colors.mutedForeground, lineHeight: 24, marginTop: 12 },
  stockWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  stockText: { fontSize: Typography.sm, color: '#F59E0B', fontWeight: '500' },
  optionSection: { marginTop: 24, paddingHorizontal: 20 },
  optionTitle: { fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, marginBottom: 12 },
  optionHint: { fontSize: Typography.xs, color: Colors.mutedForeground, fontWeight: '400' },
  optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  optionChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: BorderRadius.full,
    backgroundColor: Colors.inputBackground, borderWidth: 1.5, borderColor: 'transparent',
  },
  optionChipActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  optionChipText: { fontSize: Typography.sm, color: Colors.foreground },
  optionChipTextActive: { color: Colors.primary, fontWeight: '600' },
  addonItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, marginBottom: 8,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  addonItemActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addonName: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  addonPrice: { fontSize: Typography.sm, fontWeight: '600', color: Colors.accent },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, gap: 14, paddingBottom: 24,
  },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.full, padding: 4 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground, minWidth: 24, textAlign: 'center' },
  addToCartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16 },
  addToCartText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
