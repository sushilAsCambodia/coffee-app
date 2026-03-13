import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  { q: 'How do I place an order?', a: 'Browse the menu, tap any item to customise it, add to cart, then proceed to checkout. Choose your service mode (Takeaway or Dine-in) and payment method.' },
  { q: 'Can I cancel or modify my order?', a: 'Orders can only be cancelled before they move to "Preparing" status. Please contact the cafe directly or use the in-app chat for urgent changes.' },
  { q: 'How long will my order take?', a: 'Preparation time is usually 5–15 minutes depending on order size and cafe busyness. You\'ll receive a notification when your order is ready.' },
  { q: 'What payment methods are accepted?', a: 'We accept cash on pickup, ABA Pay, WING, and major credit/debit cards. Payment options may vary by outlet.' },
  { q: 'I didn\'t receive my order. What should I do?', a: 'Please check your order status in the Orders tab. If the status shows Completed but you didn\'t receive your order, contact us immediately using the details below.' },
  { q: 'How do I change my delivery address?', a: 'Go to Profile → Delivery Addresses to manage your saved addresses. You can add, edit, or set a default address at any time.' },
  { q: 'Can I use the app at multiple Cafe Empire outlets?', a: 'Yes! Use the shop selector on the Home screen to switch between outlets. Your cart will be cleared when switching outlets.' },
];

const CONTACTS = [
  { icon: 'call-outline', label: 'Call Us', value: '+855 XX XXX XXXX', action: () => Linking.openURL('tel:+855XXXXXXXX') },
  { icon: 'mail-outline', label: 'Email Us', value: 'support@cafeempire.com', action: () => Linking.openURL('mailto:support@cafeempire.com') },
  { icon: 'logo-whatsapp', label: 'WhatsApp', value: 'Chat with us', action: () => Linking.openURL('https://wa.me/855XXXXXXXX') },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => prev === idx ? null : idx);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroText}>Find answers below or reach out to our team directly</Text>
        </View>

        {/* Contact Cards */}
        <View style={styles.contactRow}>
          {CONTACTS.map(c => (
            <TouchableOpacity key={c.label} style={styles.contactCard} onPress={c.action} activeOpacity={0.7}>
              <View style={styles.contactIcon}>
                <Ionicons name={c.icon as any} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={styles.contactValue} numberOfLines={1}>{c.value}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqCard}>
          {FAQS.map((faq, idx) => (
            <View key={idx} style={[styles.faqItem, idx < FAQS.length - 1 && styles.faqBorder]}>
              <TouchableOpacity style={styles.faqQuestion} onPress={() => toggle(idx)} activeOpacity={0.7}>
                <Text style={[styles.faqQ, expanded === idx && { color: Colors.primary }]}>{faq.q}</Text>
                <Ionicons
                  name={expanded === idx ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={expanded === idx ? Colors.primary : Colors.mutedForeground}
                />
              </TouchableOpacity>
              {expanded === idx && (
                <Text style={styles.faqA}>{faq.a}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Still need help */}
        <View style={styles.stillHelpBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.primary} />
          <View style={styles.stillHelpText}>
            <Text style={styles.stillHelpTitle}>Still need help?</Text>
            <Text style={styles.stillHelpSubtitle}>Our team usually responds within 24 hours</Text>
          </View>
          <TouchableOpacity style={styles.contactNowBtn} onPress={() => Linking.openURL('mailto:support@cafeempire.com')}>
            <Text style={styles.contactNowText}>Contact</Text>
          </TouchableOpacity>
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  heroIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  heroText: { fontSize: Typography.sm, color: Colors.mutedForeground, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    padding: 14, alignItems: 'center', gap: 6, ...Shadows.small,
  },
  contactIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.foreground },
  contactValue: { fontSize: Typography.xs, color: Colors.mutedForeground, textAlign: 'center' },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 4 },
  faqCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  faqItem: { paddingHorizontal: 16 },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  faqQuestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  faqQ: { flex: 1, fontSize: Typography.base, fontWeight: '600', color: Colors.foreground, paddingRight: 8 },
  faqA: { fontSize: Typography.sm, color: Colors.mutedForeground, lineHeight: 20, paddingBottom: 14 },
  stillHelpBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.xl, padding: 16,
  },
  stillHelpText: { flex: 1 },
  stillHelpTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  stillHelpSubtitle: { fontSize: Typography.xs, color: Colors.mutedForeground, marginTop: 2 },
  contactNowBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.md },
  contactNowText: { color: '#fff', fontWeight: '700', fontSize: Typography.sm },
});
