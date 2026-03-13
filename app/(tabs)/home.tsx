import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  ScrollView, ActivityIndicator, RefreshControl, Image, Dimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { useOutlet } from '../../src/context/OutletContext';
import { api, Category, Menu } from '../../src/services/api';
import { setProductCache } from '../../src/utils/productCache';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;
const LOGO = require('../../assets/images/cafe-system-logo.png');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1561522983-385a76fbb4cb?w=400';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { count } = useCart();
  const { outlets, selectedOutlet, selectOutlet } = useOutlet();
  const [shopPickerVisible, setShopPickerVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Menu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);

      // Fetch menus for all categories in parallel
      const results = await Promise.all(
        cats.map(cat => api.getMenusByCategory(cat.id).then(menus =>
          menus.map(m => ({ ...m, category_name: cat.name, category_id: cat.id }))
        ))
      );
      const merged = results.flat();
      setAllProducts(merged);
      setProductCache(merged);
    } catch (e) {
      console.error('[home] loadData error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [selectedOutlet?.id]);

  const filteredProducts = allProducts.filter(p => {
    if (selectedCategory !== null && p.category_id !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const featuredProducts = allProducts.slice(0, 5);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getEffectivePrice = (item: Menu) =>
    item.has_active_promotion && item.discounted_price != null
      ? item.discounted_price
      : item.base_price;

  const renderProductCard = ({ item }: { item: Menu }) => (
    <TouchableOpacity
      testID={`product-card-${item.id}`}
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.product_image || FALLBACK_IMAGE }}
        style={styles.productImage}
        defaultSource={{ uri: FALLBACK_IMAGE }}
      />
      {item.has_active_promotion && (
        <View style={styles.promoBadge}>
          <Text style={styles.promoText}>SALE</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCategory} numberOfLines={1}>{item.category_name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${getEffectivePrice(item).toFixed(2)}</Text>
          {item.has_active_promotion && (
            <Text style={styles.originalPrice}>${item.base_price.toFixed(2)}</Text>
          )}
          <TouchableOpacity
            testID={`quick-add-${item.id}`}
            style={styles.addBtn}
            onPress={() => router.push(`/product/${item.id}`)}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.name || 'Coffee Lover'}</Text>
            </View>
          </View>
          <TouchableOpacity
            testID="cart-icon-btn"
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.cartIconBtn}
          >
            <Ionicons name="cart-outline" size={24} color={Colors.foreground} />
            {count > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Shop Selector — customers only */}
        {user?.role !== 'driver' && outlets.length > 1 && (
          <TouchableOpacity
            style={styles.shopSelector}
            onPress={() => setShopPickerVisible(true)}
            activeOpacity={0.75}
          >
            <View style={styles.shopSelectorLeft}>
              <View style={styles.shopIconBox}>
                <Ionicons name="storefront-outline" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.shopSelectorLabel}>Current Shop</Text>
                <Text style={styles.shopSelectorName} numberOfLines={1}>
                  {selectedOutlet?.name || 'Select a shop'}
                </Text>
              </View>
            </View>
            <View style={styles.shopSelectorRight}>
              {selectedOutlet?.location ? (
                <Text style={styles.shopSelectorLocation} numberOfLines={1}>
                  {selectedOutlet.location}
                </Text>
              ) : null}
              <Ionicons name="chevron-down" size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Shop Picker Modal */}
        <Modal
          visible={shopPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setShopPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShopPickerVisible(false)}
          >
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select a Shop</Text>
              <Text style={styles.modalSubtitle}>Menu and orders will update for the chosen location</Text>
              {outlets.map(outlet => {
                const isSelected = selectedOutlet?.id === outlet.id;
                return (
                  <TouchableOpacity
                    key={outlet.id}
                    style={[styles.outletCard, isSelected && styles.outletCardSelected]}
                    onPress={async () => {
                      await selectOutlet(outlet);
                      setShopPickerVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.outletCardLeft}>
                      <View style={[styles.outletIconBox, isSelected && styles.outletIconBoxSelected]}>
                        <Ionicons name="storefront" size={20} color={isSelected ? Colors.primaryForeground : Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.outletName, isSelected && styles.outletNameSelected]}>
                          {outlet.name}
                        </Text>
                        {outlet.location ? (
                          <Text style={styles.outletLocation} numberOfLines={1}>{outlet.location}</Text>
                        ) : null}
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            testID="category-all"
            style={[styles.categoryPill, selectedCategory === null && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Ionicons name="grid" size={16} color={selectedCategory === null ? Colors.primaryForeground : Colors.foreground} />
            <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              testID={`category-${cat.id}`}
              key={cat.id}
              style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured (no filter) */}
        {selectedCategory === null && !search && featuredProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20 }}>
              {featuredProducts.map(item => (
                <TouchableOpacity
                  testID={`featured-${item.id}`}
                  key={item.id}
                  style={styles.popularCard}
                  onPress={() => router.push(`/product/${item.id}`)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.product_image || FALLBACK_IMAGE }}
                    style={styles.popularImage}
                  />
                  <View style={styles.popularOverlay}>
                    <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.popularPrice}>${getEffectivePrice(item).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Products Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory !== null
              ? categories.find(c => c.id === selectedCategory)?.name || 'Menu'
              : 'Our Menu'}
          </Text>
          <View style={styles.productGrid}>
            {filteredProducts.map(item => (
              <View key={item.id} style={{ width: CARD_WIDTH }}>
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
  cartBadge: {
    position: 'absolute', top: 2, right: 2, width: 18, height: 18,
    borderRadius: 9, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.primaryForeground, fontSize: 10, fontWeight: '700' },
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
  popularCard: { width: 200, height: 140, borderRadius: BorderRadius.lg, overflow: 'hidden', marginRight: 14, ...Shadows.medium },
  popularImage: { width: '100%', height: '100%' },
  popularOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  popularName: { color: '#fff', fontSize: Typography.sm, fontWeight: '600' },
  popularPrice: { color: Colors.accent, fontSize: Typography.base, fontWeight: '700', marginTop: 2 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 16 },
  productCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.small },
  productImage: { width: '100%', height: CARD_WIDTH * 0.75, backgroundColor: Colors.muted },
  promoBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: Colors.primary,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
  },
  promoText: { color: Colors.primaryForeground, fontSize: 10, fontWeight: '700' },
  productInfo: { padding: 12 },
  productName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground },
  productCategory: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 4 },
  price: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  originalPrice: { fontSize: Typography.xs, color: Colors.mutedForeground, textDecorationLine: 'line-through' },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: Typography.base },

  // Shop selector bar
  shopSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.small,
  },
  shopSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  shopIconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  shopSelectorLabel: { fontSize: Typography.xs, color: Colors.mutedForeground },
  shopSelectorName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground, maxWidth: 160 },
  shopSelectorRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopSelectorLocation: { fontSize: Typography.xs, color: Colors.mutedForeground, maxWidth: 100 },

  // Modal sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  modalSubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, marginBottom: 20 },

  // Outlet cards inside modal
  outletCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: BorderRadius.lg, marginBottom: 10,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
  },
  outletCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  outletCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  outletIconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  outletIconBoxSelected: { backgroundColor: Colors.primary },
  outletName: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  outletNameSelected: { color: Colors.primary },
  outletLocation: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
});
