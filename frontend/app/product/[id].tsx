import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const PRODUCT_IMAGES: Record<string, string> = {
  latte: 'https://images.unsplash.com/photo-1561522983-385a76fbb4cb?w=600',
  cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600',
  americano: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=600',
  mocha: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600',
  flatwhite: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600',
  iced_latte: 'https://images.unsplash.com/photo-1695741996464-857c90c635c3?w=600',
  cold_brew: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600',
  frappe: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600',
  matcha: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600',
  chai: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=600',
  hotchoc: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600',
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=600',
  cheesecake: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600',
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSugar, setSelectedSugar] = useState('Normal');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await api.getProduct(id!);
      setProduct(data);
      if (data.sizes?.length > 0) setSelectedSize(data.sizes[0].name);
      if (data.sugar_levels?.length > 0) setSelectedSugar(data.sugar_levels[Math.min(2, data.sugar_levels.length - 1)]);
    } catch (e) {
      Alert.alert('Error', 'Product not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (name: string) => {
    setSelectedAddons(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const calculatePrice = () => {
    if (!product) return 0;
    const sizePrice = product.sizes?.find((s: any) => s.name === selectedSize)?.price || product.base_price;
    const addonTotal = selectedAddons.reduce((sum: number, name: string) => {
      const addon = product.add_ons?.find((a: any) => a.name === name);
      return sum + (addon?.price || 0);
    }, 0);
    return (sizePrice + addonTotal) * quantity;
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await api.addToCart({
        product_id: product.product_id,
        quantity,
        size: selectedSize,
        sugar_level: selectedSugar,
        add_ons: selectedAddons,
      });
      Alert.alert('Added!', `${product.name} added to cart`, [
        { text: 'Continue Shopping', onPress: () => router.back() },
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const totalPrice = calculatePrice();
  const imageUri = PRODUCT_IMAGES[product.image] || PRODUCT_IMAGES.latte;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity testID="product-back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
        </View>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.star} />
            <Text style={styles.ratingText}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviews} reviews)</Text>
            <View style={styles.dot} />
            <Ionicons name="time-outline" size={14} color={Colors.mutedForeground} />
            <Text style={styles.prepTime}>{product.prep_time}</Text>
          </View>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Size Selection */}
        {product.sizes?.length > 0 && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Size</Text>
            <View style={styles.optionRow}>
              {product.sizes.map((size: any) => (
                <TouchableOpacity
                  testID={`size-${size.name}`}
                  key={size.name}
                  style={[styles.sizeChip, selectedSize === size.name && styles.sizeChipActive]}
                  onPress={() => setSelectedSize(size.name)}
                >
                  <Text style={[styles.sizeLabel, selectedSize === size.name && styles.sizeLabelActive]}>{size.label || size.name}</Text>
                  <Text style={[styles.sizePrice, selectedSize === size.name && styles.sizePriceActive]}>${size.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sugar Level */}
        {product.sugar_levels?.length > 1 && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Sugar Level</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {product.sugar_levels.map((level: string) => (
                  <TouchableOpacity
                    testID={`sugar-${level}`}
                    key={level}
                    style={[styles.sugarChip, selectedSugar === level && styles.sugarChipActive]}
                    onPress={() => setSelectedSugar(level)}
                  >
                    <Text style={[styles.sugarText, selectedSugar === level && styles.sugarTextActive]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Add-ons */}
        {product.add_ons?.length > 0 && (
          <View style={styles.optionSection}>
            <Text style={styles.optionTitle}>Add-ons</Text>
            {product.add_ons.map((addon: any) => {
              const isSelected = selectedAddons.includes(addon.name);
              return (
                <TouchableOpacity
                  testID={`addon-${addon.name}`}
                  key={addon.name}
                  style={[styles.addonItem, isSelected && styles.addonItemActive]}
                  onPress={() => toggleAddon(addon.name)}
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

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityControl}>
          <TouchableOpacity testID="qty-minus" style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove" size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity testID="qty-plus" style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Ionicons name="add" size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity testID="add-to-cart-btn" style={styles.addToCartBtn} onPress={handleAddToCart} disabled={adding} activeOpacity={0.85}>
          {adding ? (
            <ActivityIndicator color={Colors.primaryForeground} />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color={Colors.primaryForeground} />
              <Text style={styles.addToCartText}>Add · ${totalPrice.toFixed(2)}</Text>
            </>
          )}
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, textAlign: 'center' },
  scrollContent: { paddingBottom: 20 },
  imageContainer: {
    marginHorizontal: 20, marginTop: 8, borderRadius: BorderRadius.xl,
    overflow: 'hidden', backgroundColor: Colors.muted,
  },
  productImage: { width: '100%', height: 250 },
  infoCard: { paddingHorizontal: 20, paddingTop: 20 },
  productName: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  ratingText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },
  reviewCount: { fontSize: Typography.xs, color: Colors.mutedForeground },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.mutedForeground, marginHorizontal: 4 },
  prepTime: { fontSize: Typography.xs, color: Colors.mutedForeground },
  description: { fontSize: Typography.base, color: Colors.mutedForeground, lineHeight: 24, marginTop: 12 },
  optionSection: { marginTop: 24, paddingHorizontal: 20 },
  optionTitle: { fontSize: Typography.lg, fontWeight: '600', color: Colors.foreground, marginBottom: 12 },
  optionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  sizeChip: {
    flex: 1, minWidth: 80, paddingVertical: 14, paddingHorizontal: 12, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.inputBackground, borderWidth: 2, borderColor: 'transparent', alignItems: 'center',
  },
  sizeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  sizeLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },
  sizeLabelActive: { color: Colors.primary },
  sizePrice: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 4 },
  sizePriceActive: { color: Colors.primary },
  sugarChip: {
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: BorderRadius.full,
    backgroundColor: Colors.inputBackground, borderWidth: 1.5, borderColor: 'transparent',
  },
  sugarChipActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  sugarText: { fontSize: Typography.sm, color: Colors.foreground },
  sugarTextActive: { color: Colors.primary, fontWeight: '600' },
  addonItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, marginBottom: 8,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  addonItemActive: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addonName: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  addonPrice: { fontSize: Typography.sm, fontWeight: '600', color: Colors.accent },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 14, paddingBottom: 24,
  },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.full, padding: 4 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground, minWidth: 24, textAlign: 'center' },
  addToCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16,
  },
  addToCartText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
