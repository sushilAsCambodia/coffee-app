import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Typography, BorderRadius, Shadows } from '../src/constants/theme';

const LOGO = require('../assets/images/cafe-system-icon.png');

export default function AuthScreen() {
  const router = useRouter();
  const { user, loading, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'driver' ? '/(driver)/dashboard' : '/(tabs)/home');
    }
  }, [user, loading]);

  const handleSubmit = async () => {
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
    } catch (e: any) {
      setError(e.message || (mode === 'login' ? 'Login failed.' : 'Registration failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(61,40,23,0.85)', 'rgba(61,40,23,0.95)']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Premium Coffee, Delivered</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'login' ? 'Sign in to continue' : 'Join Khmer Empire Coffee'}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  testID="register-name-input"
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                testID="login-email-input"
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                testID="login-password-input"
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                testID="toggle-password-btn"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="login-submit-btn"
              style={styles.loginBtn}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <Text style={styles.loginBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchBtn} onPress={switchMode}>
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchLink}>
                  {mode === 'login' ? 'Register' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>

            {mode === 'login' && (
              <View style={styles.demoBox}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.mutedForeground} />
                <View>
                  <Text style={styles.demoLabel}>Demo account:</Text>
                  <Text style={styles.demoText}>demo@coffeeapp.com  /  password</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.foreground },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 140, height: 140, borderRadius: 20 },
  tagline: { color: Colors.accent, fontSize: Typography.lg, fontWeight: '300', marginTop: 12, letterSpacing: 1 },
  formCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: 28, ...Shadows.large },
  formTitle: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  formSubtitle: { fontSize: Typography.base, color: Colors.mutedForeground, marginBottom: 24 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2',
    padding: 12, borderRadius: BorderRadius.md, marginBottom: 16, gap: 8,
  },
  errorText: { color: Colors.destructive, fontSize: Typography.sm, flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, ...Shadows.small,
  },
  loginBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: Typography.sm, color: Colors.mutedForeground },
  switchLink: { color: Colors.primary, fontWeight: '600' },
  demoBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginTop: 20, backgroundColor: Colors.muted, padding: 12, borderRadius: BorderRadius.md,
  },
  demoLabel: { color: Colors.mutedForeground, fontSize: Typography.xs, fontWeight: '600', marginBottom: 4 },
  demoText: { color: Colors.mutedForeground, fontSize: Typography.xs },
});
