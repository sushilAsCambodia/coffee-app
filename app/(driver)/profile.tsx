import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function DriverProfile() {
  const { user, logout, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name || '');
  const [phone, setPhone]     = useState(user?.phone || '');
  const [saving, setSaving]   = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'D';

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name: name.trim(), phone: phone.trim() || null as any });
      await updateUser(updated);
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

          {/* Header */}
          <View style={s.headerRow}>
            <Text style={s.title}>Profile</Text>
            {!editing ? (
              <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.headerActions}>
                <TouchableOpacity onPress={handleCancel} style={s.cancelBtn}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn}>
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Avatar + identity */}
          <View style={s.heroCard}>
            <View style={s.avatarRing}>
              <View style={s.avatar}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            </View>
            <View style={s.driverBadge}>
              <Ionicons name="bicycle" size={14} color="#3B82F6" />
              <Text style={s.driverBadgeText}>Delivery Driver</Text>
            </View>

            {user?.vehicle || user?.plate ? (
              <View style={s.vehicleRow}>
                {user.vehicle && (
                  <View style={s.vehicleChip}>
                    <Ionicons name="bicycle" size={14} color={Colors.primary} />
                    <Text style={s.vehicleText}>{user.vehicle}</Text>
                  </View>
                )}
                {user.plate && (
                  <View style={s.vehicleChip}>
                    <Ionicons name="card-outline" size={14} color={Colors.primary} />
                    <Text style={s.vehicleText}>{user.plate}</Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>

          {/* Info / Edit card */}
          <View style={s.infoCard}>
            <Text style={s.cardTitle}>Personal Information</Text>

            {/* Name */}
            <View style={s.fieldRow}>
              <View style={s.fieldIconBox}>
                <Ionicons name="person-outline" size={16} color={Colors.primary} />
              </View>
              <View style={s.fieldContent}>
                <Text style={s.fieldLabel}>Full Name</Text>
                {editing ? (
                  <TextInput
                    style={s.fieldInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor={Colors.mutedForeground}
                    autoCapitalize="words"
                  />
                ) : (
                  <Text style={s.fieldValue}>{user?.name || '—'}</Text>
                )}
              </View>
            </View>

            <View style={[s.fieldRow, s.fieldBorder]}>
              <View style={s.fieldIconBox}>
                <Ionicons name="mail-outline" size={16} color={Colors.primary} />
              </View>
              <View style={s.fieldContent}>
                <Text style={s.fieldLabel}>Email Address</Text>
                <Text style={s.fieldValue}>{user?.email || '—'}</Text>
              </View>
            </View>

            <View style={[s.fieldRow, s.fieldBorder]}>
              <View style={s.fieldIconBox}>
                <Ionicons name="call-outline" size={16} color={Colors.primary} />
              </View>
              <View style={s.fieldContent}>
                <Text style={s.fieldLabel}>Phone Number</Text>
                {editing ? (
                  <TextInput
                    style={s.fieldInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={s.fieldValue}>{user?.phone || '—'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color="#10B981" />
              <Text style={s.statValue}>—</Text>
              <Text style={s.statLabel}>Deliveries</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="star-outline" size={22} color="#F59E0B" />
              <Text style={s.statValue}>—</Text>
              <Text style={s.statLabel}>Rating</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="time-outline" size={22} color={Colors.primary} />
              <Text style={s.statValue}>—</Text>
              <Text style={s.statLabel}>Avg Time</Text>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity testID="driver-logout-btn" style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <View style={s.logoutIconBox}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </View>
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 16 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  editBtnText: { fontSize: Typography.sm, fontWeight: '700', color: Colors.primary },
  headerActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  cancelText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.mutedForeground },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: BorderRadius.full, minWidth: 60, alignItems: 'center' },
  saveBtnText: { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },

  heroCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 24, alignItems: 'center', gap: 12, ...Shadows.medium },
  avatarRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#3B82F620', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: Typography['2xl'], fontWeight: '700', color: '#3B82F6' },
  driverBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3B82F615', paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#3B82F630' },
  driverBadgeText: { color: '#3B82F6', fontSize: Typography.sm, fontWeight: '700' },
  vehicleRow: { flexDirection: 'row', gap: 8 },
  vehicleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  vehicleText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary },

  infoCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  cardTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.7, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  fieldBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  fieldIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: Typography.xs, fontWeight: '600', color: Colors.mutedForeground, marginBottom: 3 },
  fieldValue: { fontSize: Typography.base, color: Colors.foreground, fontWeight: '500' },
  fieldInput: { fontSize: Typography.base, color: Colors.foreground, borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingBottom: 2 },

  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: BorderRadius.xl, paddingVertical: 18, ...Shadows.small },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  statLabel: { fontSize: Typography.xs, color: Colors.mutedForeground, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', paddingVertical: 15, borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(196,69,54,0.25)', marginTop: 8 },
  logoutIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.destructive, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: Colors.destructive, fontSize: Typography.base, fontWeight: '700' },
});
