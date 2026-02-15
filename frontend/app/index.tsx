import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import * as WebBrowser from 'expo-web-browser';

const { width, height } = Dimensions.get('window');
const LOGO_URL = 'https://customer-assets.emergentagent.com/job_caffeine-hub-15/artifacts/68ek0vii_image.png';

export default function LoginScreen() {
  const router = useRouter();
  const { user, loading, login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)/home');
    }
  }, [user, loading]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const redirectUrl = `${backendUrl}/auth-callback`;
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      await WebBrowser.openBrowserAsync(authUrl);
    } catch (e) {
      setError('Google login failed');
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo Area */}
          <View style={styles.logoArea}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Premium Coffee, Delivered</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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
              <TouchableOpacity testID="toggle-password-btn" onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity testID="login-submit-btn" style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity testID="google-login-btn" style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={20} color={Colors.foreground} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="go-to-register-btn" onPress={() => router.push('/register')} style={styles.registerLink}>
              <Text style={styles.registerText}>
                Don't have an account? <Text style={styles.registerTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

            {/* Demo credentials hint */}
            <View style={styles.demoHint}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.mutedForeground} />
              <Text style={styles.demoText}>Demo: demo@cafeempire.com / demo123</Text>
            </View>
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
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: 28,
    ...Shadows.large,
  },
  formTitle: { fontSize: Typography['3xl'], fontWeight: '700', color: Colors.foreground, marginBottom: 4 },
  formSubtitle: { fontSize: Typography.base, color: Colors.mutedForeground, marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: BorderRadius.md, marginBottom: 16, gap: 8 },
  errorText: { color: Colors.destructive, fontSize: Typography.sm, flex: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.foreground },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.small,
  },
  loginBtnText: { color: Colors.primaryForeground, fontSize: Typography.base, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { paddingHorizontal: 16, color: Colors.mutedForeground, fontSize: Typography.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  googleBtnText: { color: Colors.foreground, fontSize: Typography.base, fontWeight: '500' },
  registerLink: { alignItems: 'center', marginTop: 20 },
  registerText: { color: Colors.mutedForeground, fontSize: Typography.sm },
  registerTextBold: { color: Colors.primary, fontWeight: '600' },
  demoHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
  demoText: { color: Colors.mutedForeground, fontSize: Typography.xs },
});
