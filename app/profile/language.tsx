import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../src/services/api';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

const LOCALE_KEY = '@coffee_app_locale';

type Language = { code: string; name: string; native: string; flag: string };

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then(v => { if (v) setSelected(v); });
  }, []);

  const handleSelect = async (code: string) => {
    if (code === selected) return;
    setSaving(true);
    try {
      await api.setLocale(code);
      setSelected(code);
      Alert.alert('Language Updated', `App language has been changed. Some content may require a restart to fully update.`);
    } catch {
      Alert.alert('Error', 'Failed to update language.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🌍</Text>
          <View>
            <Text style={styles.bannerTitle}>Choose Your Language</Text>
            <Text style={styles.bannerSubtitle}>Menu and app content will be shown in the selected language</Text>
          </View>
        </View>

        <View style={styles.card}>
          {LANGUAGES.map((lang, idx) => {
            const isSelected = selected === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.row, idx < LANGUAGES.length - 1 && styles.rowBorder, isSelected && styles.rowSelected]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <View style={styles.flag}>
                  <Text style={styles.flagEmoji}>{lang.flag}</Text>
                </View>
                <View style={styles.langInfo}>
                  <Text style={[styles.langName, isSelected && styles.langNameSelected]}>{lang.name}</Text>
                  <Text style={styles.langNative}>{lang.native}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.mutedForeground} />
          <Text style={styles.infoText}>
            Menu item names and descriptions will switch to your selected language if available. English is used as a fallback.
          </Text>
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
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.xl, padding: 16,
  },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.foreground },
  bannerSubtitle: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 2, lineHeight: 18 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.small },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowSelected: { backgroundColor: Colors.secondary },
  flag: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  flagEmoji: { fontSize: 26 },
  langInfo: { flex: 1 },
  langName: { fontSize: Typography.base, fontWeight: '600', color: Colors.foreground },
  langNameSelected: { color: Colors.primary },
  langNative: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 2 },
  checkBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 14, ...Shadows.small,
  },
  infoText: { flex: 1, fontSize: Typography.xs, color: Colors.mutedForeground, lineHeight: 18 },
});
