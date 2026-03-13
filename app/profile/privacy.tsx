import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius } from '../../src/constants/theme';

const SECTIONS = [
  {
    icon: 'person-circle-outline',
    title: 'Information We Collect',
    body: 'We collect information you provide directly: name, email address, phone number, and order history. We also automatically collect device information, app usage data, and location (only when you grant permission).',
  },
  {
    icon: 'construct-outline',
    title: 'How We Use Your Information',
    body: 'We use your information to process orders, send order status notifications, improve our service, personalise your experience, and communicate promotions (if you opt in).',
  },
  {
    icon: 'share-social-outline',
    title: 'Information Sharing',
    body: 'We do not sell your personal data. We share information only with: (a) the specific Cafe Empire outlet fulfilling your order, (b) payment processors, and (c) service providers necessary to operate our platform.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Data Security',
    body: 'We use industry-standard encryption (TLS/SSL) for all data transmission. Passwords are hashed and never stored in plain text. We regularly review our security practices.',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Data Stored on Your Device',
    body: 'Your authentication token and preferences are stored locally on your device using encrypted AsyncStorage. You can clear this data by logging out or uninstalling the app.',
  },
  {
    icon: 'eye-off-outline',
    title: 'Your Rights',
    body: 'You have the right to access, correct, or delete your personal data at any time. You may request data deletion by contacting us at privacy@cafeempire.com. Account deletion removes all associated personal data within 30 days.',
  },
  {
    icon: 'people-outline',
    title: 'Children\'s Privacy',
    body: 'Our service is not directed at children under 13. We do not knowingly collect personal information from children. If we discover we have collected such data, we will delete it promptly.',
  },
  {
    icon: 'refresh-circle-outline',
    title: 'Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. We will notify you via the app of any material changes. Continued use of the service after changes constitutes acceptance.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Your Privacy Matters</Text>
          <Text style={styles.heroSubtitle}>We are committed to protecting your personal information and being transparent about how we use it.</Text>
        </View>

        <View style={styles.metaBox}>
          <Ionicons name="calendar-outline" size={16} color={Colors.mutedForeground} />
          <Text style={styles.metaText}>Last updated: January 2026</Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name={section.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.contactBox} onPress={() => Linking.openURL('mailto:privacy@cafeempire.com')}>
          <Ionicons name="mail-outline" size={20} color={Colors.primary} />
          <View>
            <Text style={styles.contactTitle}>Privacy Inquiries</Text>
            <Text style={styles.contactEmail}>privacy@cafeempire.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.mutedForeground} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <Text style={styles.footer}>© 2026 Khmer Empire Co., Ltd. All rights reserved.</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.card,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.foreground },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  heroIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  heroSubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  metaBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: Typography.xs, color: Colors.mutedForeground },
  sectionCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground, flex: 1 },
  sectionBody: { fontSize: Typography.sm, color: Colors.mutedForeground, lineHeight: 22 },
  contactBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.xl, padding: 16,
  },
  contactTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.foreground },
  contactEmail: { fontSize: Typography.sm, color: Colors.primary, marginTop: 2 },
  footer: { fontSize: Typography.xs, color: Colors.mutedForeground, textAlign: 'center', paddingTop: 8 },
});
