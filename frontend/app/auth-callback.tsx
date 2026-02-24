import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Typography } from '../src/constants/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL params
        const token = params.token as string;
        if (token) {
          await loginWithGoogle(token);
          // Redirect to home after successful login
          router.replace('/(tabs)/home');
        } else {
          setError('No authentication token received');
          setTimeout(() => router.replace('/'), 3000);
        }
      } catch (e: any) {
        setError(e.message || 'Authentication failed');
        setTimeout(() => router.replace('/'), 3000);
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.redirectText}>Redirecting to login...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Completing authentication...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.base,
    color: Colors.mutedForeground,
  },
  errorText: {
    fontSize: Typography.lg,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  redirectText: {
    fontSize: Typography.sm,
    color: Colors.mutedForeground,
  },
});
