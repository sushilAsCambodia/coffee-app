import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const LOGO = require('../../assets/images/cafe-system-logo.png');

type MenuItem = {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  action: () => void;
  badge?: string;
};

type Section = {
  title: string;
  items: MenuItem[];
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  const sections: Section[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', iconBg: '#EBF4FF', iconColor: '#3B82F6', action: () => router.push('/profile/edit') },
        { icon: 'location-outline', label: 'Delivery Addresses', iconBg: '#FEF3C7', iconColor: '#D97706', action: () => router.push('/profile/addresses') },
        { icon: 'card-outline', label: 'Payment Methods', iconBg: '#ECFDF5', iconColor: '#059669', action: () => router.push('/profile/payment-methods') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', iconBg: '#FDF4FF', iconColor: '#9333EA', action: () => router.push('/profile/notifications') },
        { icon: 'language-outline', label: 'Language', iconBg: '#FFF7ED', iconColor: '#EA580C', action: () => router.push('/profile/language'), badge: 'EN' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help & Support', iconBg: '#F0FDF4', iconColor: '#16A34A', action: () => router.push('/profile/help') },
        { icon: 'star-outline', label: 'Rate the App', iconBg: '#FFFBEB', iconColor: '#F59E0B', action: () => Linking.openURL('https://apps.apple.com') },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'document-text-outline', label: 'Terms & Conditions', iconBg: '#F8FAFC', iconColor: '#64748B', action: () => router.push('/profile/terms') },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', iconBg: '#F8FAFC', iconColor: '#64748B', action: () => router.push('/profile/privacy') },
      ],
    },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero Header ── */}
        <View style={styles.hero}>
          <View style={styles.heroDecorCircle1} />
          <View style={styles.heroDecorCircle2} />

          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
            <Ionicons name="camera" size={12} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.heroName}>{user?.name || 'Guest'}</Text>
          <Text style={styles.heroEmail}>{user?.email || ''}</Text>

          {/* Member pill */}
          <View style={styles.memberPill}>
            <Ionicons name="cafe" size={12} color={Colors.accent} />
            <Text style={styles.memberPillText}>Cafe Empire Member</Text>
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={22} color={Colors.primary} />
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star-outline" size={22} color={Colors.primary} />
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* ── Menu Sections ── */}
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuRow, idx < section.items.length - 1 && styles.menuRowBorder]}
                  onPress={item.action}
                  activeOpacity={0.65}
                >
                  <View style={styles.menuRowLeft}>
                    <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon as any} size={19} color={item.iconColor} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuRowRight}>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={17} color={Colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Logout ── */}
        <TouchableOpacity
          testID="logout-btn"
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* ── App Footer ── */}
        <View style={styles.footer}>
          <Image source={LOGO} style={styles.footerLogo} resizeMode="contain" />
          <Text style={styles.footerName}>Cafe Empire</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: { paddingBottom: 40 },

  /* ── Hero ── */
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  heroDecorCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -40,
  },
  heroDecorCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30,
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: Typography['3xl'], fontWeight: '700', color: '#fff', letterSpacing: 1 },
  editBadge: {
    position: 'absolute',
    top: 70, right: '34%',
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  heroName: { fontSize: Typography.xl, fontWeight: '700', color: '#fff', marginTop: 10 },
  heroEmail: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  memberPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 5,
    marginTop: 10, borderWidth: 1, borderColor: 'rgba(212,165,116,0.4)',
  },
  memberPillText: { fontSize: Typography.xs, color: Colors.accent, fontWeight: '600' },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.card,
    marginHorizontal: 20, marginTop: -20,
    borderRadius: BorderRadius.xl, paddingVertical: 18,
    ...Shadows.medium,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  statLabel: { fontSize: Typography.xs, color: Colors.mutedForeground, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  /* ── Sections ── */
  section: { marginTop: 24, marginHorizontal: 20 },
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: '700', color: Colors.mutedForeground,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadows.small,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuIconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { fontSize: Typography.base, fontWeight: '500', color: Colors.foreground },
  menuRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },

  /* ── Logout ── */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 28,
    backgroundColor: '#FEF2F2',
    paddingVertical: 15, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(196,69,54,0.25)',
  },
  logoutIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.destructive,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { color: Colors.destructive, fontSize: Typography.base, fontWeight: '700' },

  /* ── Footer ── */
  footer: { alignItems: 'center', paddingTop: 32, gap: 4 },
  footerLogo: { width: 44, height: 44, borderRadius: 12 },
  footerName: { fontSize: Typography.sm, fontWeight: '600', color: Colors.mutedForeground, marginTop: 6 },
  footerVersion: { fontSize: Typography.xs, color: Colors.mutedForeground },
});
