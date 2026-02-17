import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'driver123', phone: '', vehicle: 'Honda PCX', plate: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setDrivers(await api.getDrivers()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.phone) { Alert.alert('Error', 'Fill all required fields'); return; }
    setSaving(true);
    try { await api.createDriver(form); setShowAdd(false); setForm({ name: '', email: '', password: 'driver123', phone: '', vehicle: 'Honda PCX', plate: '' }); load(); }
    catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Driver', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await api.deleteDriver(id); load(); } catch (e) { Alert.alert('Error', 'Failed'); } } }
    ]);
  };

  if (loading) return <SafeAreaView style={s.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Drivers ({drivers.length})</Text>
        <TouchableOpacity testID="add-driver-btn" style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={Colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <FlatList data={drivers} keyExtractor={i => i.user_id} contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={s.driverCard}>
            <View style={[s.avatar, { backgroundColor: item.is_available ? Colors.success + '20' : Colors.muted }]}>
              <Ionicons name="person" size={24} color={item.is_available ? Colors.success : Colors.mutedForeground} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.driverName}>{item.name}</Text>
              <Text style={s.driverMeta}>{item.vehicle} · {item.plate}</Text>
              <Text style={s.driverMeta}>{item.phone} · {item.email}</Text>
              <View style={s.statsRow}>
                <View style={s.statChip}>
                  <Text style={s.statNum}>{item.total_deliveries || 0}</Text>
                  <Text style={s.statLabel}>Delivered</Text>
                </View>
                <View style={s.statChip}>
                  <Text style={s.statNum}>{item.active_orders || 0}</Text>
                  <Text style={s.statLabel}>Active</Text>
                </View>
                <View style={[s.availBadge, { backgroundColor: item.is_available ? Colors.success + '15' : Colors.destructive + '15' }]}>
                  <View style={[s.availDot, { backgroundColor: item.is_available ? Colors.success : Colors.destructive }]} />
                  <Text style={[s.availText, { color: item.is_available ? Colors.success : Colors.destructive }]}>{item.is_available ? 'Available' : 'Busy'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity testID={`delete-driver-${item.user_id}`} style={s.deleteBtn} onPress={() => handleDelete(item.user_id, item.name)}>
              <Ionicons name="trash-outline" size={18} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="bicycle-outline" size={48} color={Colors.muted} /><Text style={s.emptyText}>No drivers yet</Text></View>}
      />

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Driver</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={Colors.foreground} /></TouchableOpacity>
            </View>
            <TextInput testID="driver-name" style={s.input} placeholder="Full Name *" placeholderTextColor={Colors.mutedForeground} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
            <TextInput testID="driver-email" style={s.input} placeholder="Email *" placeholderTextColor={Colors.mutedForeground} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
            <TextInput testID="driver-phone" style={s.input} placeholder="Phone *" placeholderTextColor={Colors.mutedForeground} value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" />
            <TextInput style={s.input} placeholder="Vehicle" placeholderTextColor={Colors.mutedForeground} value={form.vehicle} onChangeText={v => setForm(f => ({ ...f, vehicle: v }))} />
            <TextInput style={s.input} placeholder="Plate Number" placeholderTextColor={Colors.mutedForeground} value={form.plate} onChangeText={v => setForm(f => ({ ...f, plate: v }))} />
            <TouchableOpacity testID="save-driver-btn" style={s.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={s.saveBtnText}>Add Driver</Text>}
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
  driverCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: 16, marginBottom: 12, ...Shadows.small },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  driverMeta: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  statChip: { backgroundColor: Colors.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNum: { fontSize: Typography.xs, fontWeight: '700', color: Colors.foreground },
  statLabel: { fontSize: 10, color: Colors.mutedForeground },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 10, fontWeight: '600' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.destructive + '10', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.mutedForeground, fontSize: Typography.base },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  input: { backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, padding: 14, fontSize: Typography.base, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
});
