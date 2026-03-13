import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By downloading, installing, or using the Cafe Empire mobile application, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the app.',
  },
  {
    title: '2. Use of the Service',
    body: 'The Cafe Empire app is intended for personal, non-commercial use only. You must be at least 13 years of age to use this service. You agree not to misuse the service, attempt to gain unauthorised access, or interfere with the operation of the platform.',
  },
  {
    title: '3. Account Registration',
    body: 'To place orders you must create an account. You are responsible for maintaining the confidentiality of your credentials. You agree to notify us immediately of any unauthorised use of your account.',
  },
  {
    title: '4. Orders and Payments',
    body: 'All orders are subject to availability. Prices displayed in the app are in local currency (KHR/USD) and may change without prior notice. Orders are confirmed only after successful payment processing.',
  },
  {
    title: '5. Cancellations and Refunds',
    body: 'Orders may be cancelled before they enter "Preparing" status. Refunds for eligible cancellations will be processed within 3–5 business days to the original payment method. We reserve the right to refuse refunds for completed orders.',
  },
  {
    title: '6. Intellectual Property',
    body: 'All content within the Cafe Empire app, including logos, text, graphics, and software, is the property of Khmer Empire Co., Ltd. and is protected by applicable intellectual property laws.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'Cafe Empire shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount paid for the relevant order.',
  },
  {
    title: '8. Changes to Terms',
    body: 'We reserve the right to update these terms at any time. Continued use of the app after changes constitutes acceptance of the revised terms. We will notify users of significant changes via the app.',
  },
  {
    title: '9. Contact',
    body: 'For questions about these Terms, please contact us at legal@cafeempire.com.',
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.metaBox}>
          <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          <Text style={styles.metaText}>Last updated: January 2026 · Effective immediately</Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Khmer Empire Co., Ltd. All rights reserved.</Text>
        </View>

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
  content: { padding: 16, paddingBottom: 40 },
  metaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.lg, padding: 12, marginBottom: 16,
  },
  metaText: { fontSize: Typography.xs, color: Colors.mutedForeground, flex: 1 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground, marginBottom: 6 },
  sectionBody: { fontSize: Typography.sm, color: Colors.mutedForeground, lineHeight: 22 },
  footer: { paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8 },
  footerText: { fontSize: Typography.xs, color: Colors.mutedForeground, textAlign: 'center' },
});
