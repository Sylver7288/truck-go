import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useLogin } from '@workspace/api-client-react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        if (data.role !== 'driver') {
          setError('This app is for drivers only. Please use the customer web app.');
          return;
        }
        await login({ userId: data.userId, role: 'driver', name: data.name, email: data.email });
        router.replace('/');
      },
      onError: () => {
        setError('Invalid email or password. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loginMutation.mutate({ data: { email: email.trim(), password, role: 'driver' } });
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / brand mark */}
        <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
          <Feather name="truck" size={32} color="#FFFFFF" />
        </View>

        <Text style={[styles.brand, { color: colors.foreground }]}>TruckGo</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Driver Portal</Text>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign In</Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loginMutation.isPending ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            activeOpacity={0.85}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo hint */}
        <View style={styles.hint}>
          <Feather name="info" size={12} color={colors.mutedForeground} />
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            Use driver credentials from the TruckGo platform
          </Text>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 34 : insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 32,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
    lineHeight: 18,
  },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  hintText: {
    fontSize: 12,
  },
});
