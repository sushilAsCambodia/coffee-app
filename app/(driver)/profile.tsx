import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Colors, Typography, BorderRadius, Shadows } from '../../src/constants/theme';

export default function DriverProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}><Text style={s.title}>Profile</Text></View>

        <View style={s.userCard}>
          <View style={s.avatar}>
            <Ionicons name="person" size={32} color="#3B82F6" />
          </View>
          <Text style={s.name}>{user?.name || 'Driver'}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={s.metaRow}>
            {user?.vehicle && <View style={s.metaChip}><Ionicons name="bicycle" size={14} color={Colors.foreground} /><Text style={s.metaText}>{user.vehicle}</Text></View>}
            {user?.plate && <View style={s.metaChip}><Text style={s.metaText}>{user.plate}</Text></View>}
          </View>
          <View style={s.driverBadge}>
            <Ionicons name="bicycle" size={14} color="#3B82F6" />
            <Text style={s.driverBadgeText}>Delivery Driver</Text>
          </View>
        </View>

        <TouchableOpacity testID="driver-logout-btn" style={s.logoutBtn} onPress={() => {
          Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
          ]);
        }}>
          <Ionicons name="log-out-outline" size={20} color={Colors.destructive} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.foreground },
  userCard: { alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 20, borderRadius: BorderRadius.xl, padding: 28, ...Shadows.medium },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3B82F620', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: Typography.xl, fontWeight: '700', color: Colors.foreground },
  email: { fontSize: Typography.sm, color: Colors.mutedForeground, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  metaText: { fontSize: Typography.xs, color: Colors.foreground, fontWeight: '500' },
  driverBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3B82F620', paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, marginTop: 12 },
  driverBadgeText: { color: '#3B82F6', fontSize: Typography.sm, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 28, paddingVertical: 16, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.destructive },
  logoutText: { color: Colors.destructive, fontSize: Typography.base, fontWeight: '600' },
});
