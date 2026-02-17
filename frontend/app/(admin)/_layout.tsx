import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/theme';
import { StyleSheet } from 'react-native';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.mutedForeground, tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tabs.Screen name="products" options={{ title: 'Products', tabBarIcon: ({ color, size }) => <Ionicons name="cafe" size={size} color={color} /> }} />
      <Tabs.Screen name="manage-orders" options={{ title: 'Orders', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
      <Tabs.Screen name="drivers" options={{ title: 'Drivers', tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" size={size} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, height: 65, paddingBottom: 8, paddingTop: 8 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
