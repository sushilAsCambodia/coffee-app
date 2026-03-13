import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, Address } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const LABEL_ICONS: Record<string, string> = {
  Home: 'home-outline',
  Work: 'briefcase-outline',
  Other: 'location-outline',
};

const LABEL_COLORS: Record<string, { bg: string; color: string }> = {
  Home: { bg: '#EBF4FF', color: '#3B82F6' },
  Work: { bg: '#FEF3C7', color: '#D97706' },
  Other: { bg: '#F0FDF4', color: '#16A34A' },
};

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load addresses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSetDefault = async (id: number) => {
    try {
      const updated = await api.setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAddress(id);
            setAddresses(prev => prev.filter(a => a.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header onBack={() => router.back()} onAdd={() => router.push('/profile/address-form')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header onBack={() => router.back()} onAdd={() => router.push('/profile/address-form')} />

      <FlatList
        data={addresses}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={40} color={Colors.mutedForeground} />
            </View>
            <Text style={styles.emptyTitle}>No Addresses Yet</Text>
            <Text style={styles.emptyText}>Add a delivery address to make ordering faster.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/profile/address-form')}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const labelKey = item.label in LABEL_COLORS ? item.label : 'Other';
          const { bg, color } = LABEL_COLORS[labelKey];
          const iconName = LABEL_ICONS[labelKey] || 'location-outline';
          return (
            <View style={[styles.card, item.is_default && styles.cardDefault]}>
              <View style={styles.cardTop}>
                <View style={[styles.labelIcon, { backgroundColor: bg }]}>
                  <Ionicons name={iconName as any} size={20} color={color} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardLabel}>{item.label}</Text>
                    {item.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardAddress}>{item.address}</Text>
                  {!!item.city && <Text style={styles.cardCity}>{item.city}</Text>}
                </View>
              </View>

              <View style={styles.cardActions}>
                {!item.is_default && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item.id)}>
                    <Ionicons name="radio-button-on-outline" size={15} color={Colors.primary} />
                    <Text style={[styles.actionText, { color: Colors.primary }]}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/profile/address-form', params: { id: item.id, label: item.label, address: item.address, city: item.city || '', is_default: String(item.is_default) } })}>
                  <Ionicons name="pencil-outline" size={15} color={Colors.mutedForeground} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={15} color={Colors.destructive} />
                  <Text style={[styles.actionText, { color: Colors.destructive }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Header({ onBack, onAdd }: { onBack: () => void; onAdd: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Delivery Addresses</Text>
      <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
        <Ionicons name="add" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: 16, ...Shadows.small,
    borderWidth: 1, borderColor: 'transparent',
  },
  cardDefault: { borderColor: Colors.primary },
  cardTop: { flexDirection: 'row', gap: 12 },
  labelIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  cardAddress: { fontSize: Typography.sm, color: Colors.foreground, lineHeight: 20 },
  cardCity: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  defaultBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  cardActions: {
    flexDirection: 'row', gap: 16, marginTop: 14,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.mutedForeground },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  emptyText: { fontSize: Typography.sm, color: Colors.mutedForeground, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: BorderRadius.lg, marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.sm },
});
