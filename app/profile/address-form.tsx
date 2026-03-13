import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const LABELS = ['Home', 'Work', 'Other'];

const LABEL_META: Record<string, { icon: string; bg: string; color: string }> = {
  Home:  { icon: 'home-outline',      bg: '#EBF4FF', color: '#3B82F6' },
  Work:  { icon: 'briefcase-outline', bg: '#FEF3C7', color: '#D97706' },
  Other: { icon: 'location-outline',  bg: '#F0FDF4', color: '#16A34A' },
};

export default function AddressFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; label?: string; address?: string; city?: string; is_default?: string }>();

  const isEdit = !!params.id;

  const [label, setLabel] = useState(params.label || 'Home');
  const [address, setAddress] = useState(params.address || '');
  const [city, setCity] = useState(params.city || '');
  const [isDefault, setIsDefault] = useState(params.is_default === 'true');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.trim()) e.address = 'Address is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = { label, address: address.trim(), city: city.trim() || null, is_default: isDefault };
      if (isEdit && params.id) {
        await api.updateAddress(parseInt(params.id), data as any);
      } else {
        await api.createAddress(data as any);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'New Address'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Label Picker */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Address Type</Text>
            <View style={styles.labelRow}>
              {LABELS.map(l => {
                const meta = LABEL_META[l];
                const selected = label === l;
                return (
                  <TouchableOpacity
                    key={l}
                    style={[styles.labelChip, selected && styles.labelChipSelected]}
                    onPress={() => setLabel(l)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.labelChipIcon, { backgroundColor: selected ? meta.color : meta.bg }]}>
                      <Ionicons name={meta.icon as any} size={18} color={selected ? '#fff' : meta.color} />
                    </View>
                    <Text style={[styles.labelChipText, selected && { color: meta.color, fontWeight: '700' }]}>{l}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Address Fields */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Address Details</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Street Address *</Text>
              <View style={[styles.inputRow, !!errors.address && styles.inputRowError]}>
                <Ionicons name="location-outline" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={(v) => { setAddress(v); setErrors(e => ({ ...e, address: '' })); }}
                  placeholder="e.g. 123 Street Name, District"
                  placeholderTextColor={Colors.mutedForeground}
                  multiline
                  numberOfLines={2}
                />
              </View>
              {!!errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={[styles.fieldWrap, { borderTopWidth: 1, borderTopColor: Colors.border }]}>
              <Text style={styles.fieldLabel}>City / Province</Text>
              <View style={styles.inputRow}>
                <Ionicons name="business-outline" size={18} color={Colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Phnom Penh"
                  placeholderTextColor={Colors.mutedForeground}
                />
              </View>
            </View>
          </View>

          {/* Default Toggle */}
          <TouchableOpacity
            style={styles.defaultRow}
            onPress={() => setIsDefault(v => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.defaultLeft}>
              <View style={styles.defaultIconBox}>
                <Ionicons name="star-outline" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.defaultTitle}>Set as Default</Text>
                <Text style={styles.defaultSubtitle}>Use this address for all new orders</Text>
              </View>
            </View>
            <View style={[styles.toggle, isDefault && styles.toggleOn]}>
              <View style={[styles.toggleThumb, isDefault && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  saveBtn: { padding: 4, width: 40, alignItems: 'flex-end' },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  sectionTitle: {
    fontSize: Typography.sm, fontWeight: '700', color: Colors.foreground,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
  },
  labelRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  labelChip: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 12,
    borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  labelChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.secondary },
  labelChipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  labelChipText: { fontSize: Typography.sm, fontWeight: '500', color: Colors.mutedForeground },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: Typography.xs, fontWeight: '600', color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.inputBackground, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'transparent' },
  inputRowError: { borderColor: Colors.destructive },
  inputIcon: { marginRight: 8, marginTop: 2 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  errorText: { fontSize: Typography.xs, color: Colors.destructive, marginTop: 4 },
  defaultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 16, ...Shadows.small,
  },
  defaultLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  defaultIconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  defaultTitle: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  defaultSubtitle: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: Colors.border, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', ...Shadows.small },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
