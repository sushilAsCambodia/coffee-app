import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const LOGO = require('../../assets/images/cafe-system-icon.png');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/'); },
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', action: () => {} },
    { icon: 'location-outline', label: 'Delivery Addresses', action: () => {} },
    { icon: 'card-outline', label: 'Payment Methods', action: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', action: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', action: () => {} },
    { icon: 'document-text-outline', label: 'Terms & Conditions', action: () => {} },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', action: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              testID={`profile-menu-${idx}`}
              key={idx}
              style={[styles.menuItem, idx < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.destructive} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Image source={LOGO} style={styles.appLogo} resizeMode="contain" />
          <Text style={styles.appName}>Cafe Empire</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  userCard: {
    alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 20,
    borderRadius: BorderRadius.xl, padding: 24, ...Shadows.medium,
  },
  avatarContainer: { marginBottom: 12 },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.primaryForeground },
  userName: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  userEmail: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 4 },
  menuCard: {
    backgroundColor: Colors.card, marginHorizontal: 20, marginTop: 24,
    borderRadius: BorderRadius.xl, ...Shadows.small, overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconContainer: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: Typography.base, color: Colors.foreground, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.destructive,
  },
  logoutText: { color: Colors.destructive, fontSize: Typography.base, fontWeight: '600' },
  appInfo: { alignItems: 'center', paddingVertical: 32 },
  appLogo: { width: 48, height: 48, borderRadius: 12 },
  appName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.foreground, marginTop: 8 },
  appVersion: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
});
