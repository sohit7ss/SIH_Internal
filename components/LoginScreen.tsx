import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

// NOTE for Section A: this screen assumes you'll pass in the actual
// auth handlers (Gmail OAuth + password + OTP verify) via props, so
// this file has no direct API/auth-provider calls baked in — wire
// those at the call site so we don't duplicate whatever auth setup
// you've already started. Confirm navigation prop shape with you
// directly before merging (left as `onLoginSuccess` here).

type Stage = 'login' | 'forgot-request' | 'forgot-otp' | 'forgot-reset';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSendOtp: (email: string) => Promise<boolean>;
  onVerifyOtp: (email: string, otp: string) => Promise<boolean>;
  onResetPassword: (email: string, newPassword: string) => Promise<boolean>;
  onLoginSuccess: () => void;
}

export default function LoginScreen({
  onLogin,
  onSendOtp,
  onVerifyOtp,
  onResetPassword,
  onLoginSuccess,
}: LoginScreenProps) {
  const [stage, setStage] = useState<Stage>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const ok = await onLogin(email, password);
    setLoading(false);
    if (ok) onLoginSuccess();
    else setError('Incorrect email or password.');
  };

  const handleSendOtp = async () => {
    setError(null);
    setLoading(true);
    const ok = await onSendOtp(email);
    setLoading(false);
    if (ok) setStage('forgot-otp');
    else setError('Could not send OTP. Check the email address.');
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);
    const ok = await onVerifyOtp(email, otp);
    setLoading(false);
    if (ok) setStage('forgot-reset');
    else setError('Invalid or expired OTP.');
  };

  const handleResetPassword = async () => {
    setError(null);
    setLoading(true);
    const ok = await onResetPassword(email, newPassword);
    setLoading(false);
    if (ok) setStage('login');
    else setError('Could not reset password. Try again.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>
        {stage === 'login' && 'Sign in'}
        {stage === 'forgot-request' && 'Reset password'}
        {stage === 'forgot-otp' && 'Enter OTP'}
        {stage === 'forgot-reset' && 'Set new password'}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {stage === 'login' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Gmail address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage('forgot-request')}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </>
      )}

      {stage === 'forgot-request' && (
        <>
          <Text style={styles.helperText}>
            We'll send a one-time code to your Gmail address to verify it's you.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Gmail address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Sending…' : 'Send OTP'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage('login')}>
            <Text style={styles.link}>Back to sign in</Text>
          </TouchableOpacity>
        </>
      )}

      {stage === 'forgot-otp' && (
        <>
          <Text style={styles.helperText}>Enter the 6-digit code sent to {email}</Text>
          <TextInput
            style={styles.input}
            placeholder="OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Verifying…' : 'Verify OTP'}</Text>
          </TouchableOpacity>
        </>
      )}

      {stage === 'forgot-reset' && (
        <>
          <Text style={styles.helperText}>Gmail verified. Set a new password.</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Saving…' : 'Save new password'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weightSemiBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  helperText: {
    fontSize: typography.size.body,
    color: colors.textSecondary,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    fontSize: typography.size.body,
    color: colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.card,
    padding: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: colors.cardWhite,
    fontSize: typography.size.body,
    fontWeight: typography.weightSemiBold,
  },
  link: {
    color: colors.primary,
    fontSize: typography.size.body,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: typography.size.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
