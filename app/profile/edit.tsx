import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    if (newPassword) {
      if (!currentPassword) e.current_password = 'Enter your current password to change it.';
      if (newPassword.length < 6) e.new_password = 'New password must be at least 6 characters.';
      if (newPassword !== confirmPassword) e.confirm_password = 'Passwords do not match.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: any = { name, email, phone: phone || null };
      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
        payload.new_password_confirmation = confirmPassword;
      }
      const updated = await api.updateProfile(payload);
      await updateUser(updated);
      Alert.alert('Saved', 'Your profile has been updated successfully.');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = name
    ? name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.avatarHint}>Your initials are used as your avatar</Text>
          </View>

          {/* Personal Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>

            <Field
              label="Full Name"
              icon="person-outline"
              value={name}
              onChangeText={(v) => { setName(v); setErrors(e => ({ ...e, name: '' })); }}
              placeholder="Enter your full name"
              error={errors.name}
            />
            <Field
              label="Email Address"
              icon="mail-outline"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Field
              label="Phone Number"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              isLast
            />
          </View>

          {/* Change Password */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <Text style={styles.cardSubtitle}>Leave blank to keep your current password</Text>

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={(v) => { setCurrentPassword(v); setErrors(e => ({ ...e, current_password: '' })); }}
              placeholder="Enter current password"
              show={showCurrentPw}
              onToggle={() => setShowCurrentPw(s => !s)}
              error={errors.current_password}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setErrors(e => ({ ...e, new_password: '' })); }}
              placeholder="Minimum 6 characters"
              show={showNewPw}
              onToggle={() => setShowNewPw(s => !s)}
              error={errors.new_password}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors(e => ({ ...e, confirm_password: '' })); }}
              placeholder="Re-enter new password"
              show={showConfirmPw}
              onToggle={() => setShowConfirmPw(s => !s)}
              error={errors.confirm_password}
              isLast
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, error, isLast }: any) {
  return (
    <View style={[fieldStyles.wrap, !isLast && fieldStyles.border]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <Ionicons name={icon} size={18} color={Colors.mutedForeground} style={fieldStyles.icon} />
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.mutedForeground}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'words'}
        />
      </View>
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

function PasswordField({ label, value, onChangeText, placeholder, show, onToggle, error, isLast }: any) {
  return (
    <View style={[fieldStyles.wrap, !isLast && fieldStyles.border]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <Ionicons name="lock-closed-outline" size={18} color={Colors.mutedForeground} style={fieldStyles.icon} />
        <TextInput
          style={[fieldStyles.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.mutedForeground}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={onToggle} style={fieldStyles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: Typography.xs, fontWeight: '600', color: Colors.mutedForeground, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.foreground, paddingVertical: 0 },
  eyeBtn: { padding: 4 },
  error: { fontSize: Typography.xs, color: Colors.destructive, marginTop: 4 },
});

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
  content: { padding: 20, gap: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 8 },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: Typography['2xl'], fontWeight: '700', color: '#fff' },
  avatarHint: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 8 },
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadows.small,
  },
  cardTitle: {
    fontSize: Typography.sm, fontWeight: '700', color: Colors.foreground,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  cardSubtitle: {
    fontSize: Typography.xs, color: Colors.mutedForeground,
    paddingHorizontal: 16, paddingBottom: 8,
  },
});
