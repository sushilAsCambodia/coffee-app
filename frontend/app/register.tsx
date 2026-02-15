import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Typography, BorderRadius, Shadows } from '../src/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await register(email.trim(), password, name.trim(), phone.trim());
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="register-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Cafe Empire today</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              testID="register-name-input"
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={Colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              testID="register-email-input"
              style={styles.input}
              placeholder="Email address *"
              placeholderTextColor={Colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              testID="register-phone-input"
              style={styles.input}
              placeholder="Phone (optional)"
              placeholderTextColor={Colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              testID="register-password-input"
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor={Colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="register-submit-btn" style={styles.registerBtn} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator color={Colors.primaryForeground} /> : <Text style={styles.registerBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity testID="go-to-login-btn" onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  subtitle: { fontSize: Typography.base, color: Colors.mutedForeground, marginBottom: 32 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, marginBottom: 16, gap: 8 },
  errorText: { color: Colors.destructive, fontSize: Typography.sm, flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  registerBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingVertical: 16,
    alignItems: 'center', marginTop: 16, ...Shadows.small,
  },
  registerBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginText: { color: Colors.mutedForeground, fontSize: Typography.sm },
  loginTextBold: { color: Colors.primary, fontWeight: '600' },
});
