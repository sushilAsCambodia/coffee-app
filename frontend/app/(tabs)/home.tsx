import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  ScrollView, ActivityIndicator, RefreshControl, Image, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_caffeine-hub-15/artifacts/68ek0vii_image.png';

const CATEGORY_ICONS: Record<string, string> = {
  cafe: 'cafe', snow: 'snow', leaf: 'leaf', 'ice-cream': 'ice-cream-outline',
};

const PRODUCT_IMAGES: Record<string, string> = {
  latte: 'https://images.unsplash.com/photo-1561522983-385a76fbb4cb?w=400',
  cappuccino: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
  americano: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400',
  mocha: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400',
  flatwhite: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400',
  iced_latte: 'https://images.unsplash.com/photo-1695741996464-857c90c635c3?w=400',
  cold_brew: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
  frappe: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
  matcha: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400',
  chai: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400',
  hotchoc: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400',
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400',
  cheesecake: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([api.getCategories(), api.getProducts()]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const popularProducts = products.filter(p => p.is_popular);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderProductCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`product-card-${item.product_id}`}
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.product_id}`)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: PRODUCT_IMAGES[item.image] || PRODUCT_IMAGES.latte }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={Colors.star} />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${item.base_price.toFixed(2)}</Text>
          <TouchableOpacity
            testID={`quick-add-${item.product_id}`}
            style={styles.addBtn}
            onPress={() => router.push(`/product/${item.product_id}`)}
          >
            <Ionicons name="add" size={18} color={Colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} />
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Coffee Lover'}</Text>
            </View>
          </View>
          <TouchableOpacity testID="cart-icon-btn" onPress={() => router.push('/(tabs)/cart')} style={styles.cartIconBtn}>
            <Ionicons name="cart-outline" size={24} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.mutedForeground} />
          <TextInput
            testID="search-input"
            style={styles.searchInput}
            placeholder="Search coffee, tea, desserts..."
            placeholderTextColor={Colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
          <TouchableOpacity
            testID="category-all"
            style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Ionicons name="grid" size={16} color={!selectedCategory ? Colors.primaryForeground : Colors.foreground} />
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              testID={`category-${cat.category_id}`}
              key={cat.category_id}
              style={[styles.categoryPill, selectedCategory === cat.category_id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.category_id ? null : cat.category_id)}
            >
              <Ionicons name={(CATEGORY_ICONS[cat.icon] || 'cafe') as any} size={16} color={selectedCategory === cat.category_id ? Colors.primaryForeground : Colors.foreground} />
              <Text style={[styles.categoryText, selectedCategory === cat.category_id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Section (only when no category/search filter) */}
        {!selectedCategory && !search && popularProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Now</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
              {popularProducts.slice(0, 5).map(item => (
                <TouchableOpacity
                  testID={`popular-${item.product_id}`}
                  key={item.product_id}
                  style={styles.popularCard}
                  onPress={() => router.push(`/product/${item.product_id}`)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: PRODUCT_IMAGES[item.image] || PRODUCT_IMAGES.latte }} style={styles.popularImage} />
                  <View style={styles.popularOverlay}>
                    <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.popularPrice}>${item.base_price.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Products Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? categories.find(c => c.category_id === selectedCategory)?.name || 'Menu' : 'Our Menu'}
          </Text>
          <View style={styles.productGrid}>
            {filteredProducts.map(item => (
              <View key={item.product_id} style={{ width: CARD_WIDTH }}>
                {renderProductCard({ item })}
              </View>
            ))}
          </View>
          {filteredProducts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cafe-outline" size={48} color={Colors.muted} />
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogo: { width: 42, height: 42, borderRadius: 12 },
  greeting: { fontSize: Typography.sm, color: Colors.mutedForeground },
  userName: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  cartIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBackground,
    marginHorizontal: 20, borderRadius: BorderRadius.lg, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  categoriesScroll: { marginTop: 16 },
  categoriesContent: { paddingHorizontal: 20, gap: 10 },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: BorderRadius.full, backgroundColor: Colors.muted,
  },
  categoryPillActive: { backgroundColor: Colors.primary },
  categoryText: { fontSize: Typography.sm, fontWeight: '500', color: Colors.foreground },
  categoryTextActive: { color: Colors.primaryForeground },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground, paddingHorizontal: 20, marginBottom: 16 },
  popularCard: {
    width: 200, height: 140, borderRadius: BorderRadius.lg, overflow: 'hidden', marginRight: 14, ...Shadows.medium,
  },
  popularImage: { width: '100%', height: '100%' },
  popularOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  popularName: { color: '#fff', fontSize: Typography.sm, fontWeight: '600' },
  popularPrice: { color: Colors.accent, fontSize: Typography.base, fontWeight: '700', marginTop: 2 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 16 },
  productCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.small,
  },
  productImage: { width: '100%', height: CARD_WIDTH * 0.75, backgroundColor: Colors.muted },
  productInfo: { padding: 12 },
  productName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.foreground },
  reviewsText: { fontSize: Typography.xs, color: Colors.mutedForeground },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  addBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: Typography.base },
});
