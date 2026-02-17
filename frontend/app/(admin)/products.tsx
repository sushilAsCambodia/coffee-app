import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category_id: 'cat_hot', base_price: '', image: 'latte', prep_time: '5-7 min' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.getProducts(), api.getCategories()]);
      setProducts(p); setCategories(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Product', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteProduct(id); load(); } catch (e) { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const handleTogglePopular = async (id: string, current: boolean) => {
    try { await api.updateProduct(id, { is_popular: !current }); load(); } catch (e) { Alert.alert('Error', 'Failed to update'); }
  };

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.base_price) { Alert.alert('Error', 'Name and price required'); return; }
    setSaving(true);
    try {
      await api.createProduct({
        ...newProduct, base_price: parseFloat(newProduct.base_price),
        sizes: [{ name: 'Small', price: parseFloat(newProduct.base_price), label: 'S' }, { name: 'Medium', price: parseFloat(newProduct.base_price) + 0.75, label: 'M' }, { name: 'Large', price: parseFloat(newProduct.base_price) + 1.50, label: 'L' }],
        sugar_levels: ['No Sugar', 'Less Sugar', 'Normal', 'Extra Sweet'],
        add_ons: [{ name: 'Extra Shot', price: 0.75 }, { name: 'Oat Milk', price: 0.75 }],
      });
      setShowAdd(false); setNewProduct({ name: '', description: '', category_id: 'cat_hot', base_price: '', image: 'latte', prep_time: '5-7 min' }); load();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Products ({products.length})</Text>
        <TouchableOpacity testID="add-product-btn" style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <FlatList data={products} keyExtractor={i => i.product_id} contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.productItem}>
            <View style={{ flex: 1 }}>
              <Text style={s.productName}>{item.name}</Text>
              <Text style={s.productMeta}>{categories.find((c: any) => c.category_id === item.category_id)?.name} · ${item.base_price?.toFixed(2)}</Text>
              <View style={s.tagRow}>
                {item.is_popular && <View style={s.popularTag}><Text style={s.popularTagText}>Popular</Text></View>}
                <Text style={s.ratingText}>★ {item.rating}</Text>
              </View>
            </View>
            <View style={s.actions}>
              <TouchableOpacity testID={`toggle-popular-${item.product_id}`} style={[s.actionBtn, { backgroundColor: item.is_popular ? Colors.accent + '20' : Colors.muted }]} onPress={() => handleTogglePopular(item.product_id, item.is_popular)}>
                <Ionicons name={item.is_popular ? 'star' : 'star-outline'} size={18} color={item.is_popular ? Colors.accent : Colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity testID={`delete-product-${item.product_id}`} style={[s.actionBtn, { backgroundColor: Colors.destructive + '10' }]} onPress={() => handleDelete(item.product_id, item.name)}>
                <Ionicons name="trash-outline" size={18} color={Colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add Product Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.foreground} /></TouchableOpacity>
            </View>
            <TextInput testID="new-product-name" style={s.input} placeholder="Product Name" placeholderTextColor={Colors.mutedForeground} value={newProduct.name} onChangeText={v => setNewProduct(p => ({ ...p, name: v }))} />
            <TextInput testID="new-product-desc" style={s.input} placeholder="Description" placeholderTextColor={Colors.mutedForeground} value={newProduct.description} onChangeText={v => setNewProduct(p => ({ ...p, description: v }))} multiline />
            <TextInput testID="new-product-price" style={s.input} placeholder="Base Price (e.g. 3.50)" placeholderTextColor={Colors.mutedForeground} value={newProduct.base_price} onChangeText={v => setNewProduct(p => ({ ...p, base_price: v }))} keyboardType="decimal-pad" />
            <Text style={s.label}>Category</Text>
            <View style={s.catRow}>
              {categories.map(c => (
                <TouchableOpacity key={c.category_id} style={[s.catChip, newProduct.category_id === c.category_id && s.catChipActive]} onPress={() => setNewProduct(p => ({ ...p, category_id: c.category_id }))}>
                  <Text style={[s.catText, newProduct.category_id === c.category_id && s.catTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity testID="save-product-btn" style={s.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={s.saveBtnText}>Add Product</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  productItem: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 10, ...Shadows.small },
  productName: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  productMeta: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  popularTag: { backgroundColor: Colors.accent + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  popularTagText: { fontSize: 10, fontWeight: '600', color: Colors.accent },
  ratingText: { fontSize: Typography.xs, color: Colors.star },
  actions: { gap: 8, justifyContent: 'center' },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  input: { backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, padding: 14, fontSize: Typography.base, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground, marginBottom: 8, marginTop: 4 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.muted },
  catChipActive: { backgroundColor: Colors.primary },
  catText: { fontSize: Typography.sm, color: Colors.foreground },
  catTextActive: { color: Colors.primaryForeground },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
