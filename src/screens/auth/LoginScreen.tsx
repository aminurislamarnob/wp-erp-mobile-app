import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

type Step = 'site' | 'login';

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    logo: {
      width: 160,
      height: 45,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    form: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    stepLabel: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    siteInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    siteInfoLeft: {
      flex: 1,
      marginRight: spacing.md,
    },
    siteUrlText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    changeLink: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: spacing.md,
      fontSize: fontSize.md,
      backgroundColor: colors.background,
      color: colors.text,
    },
    passwordWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.background,
    },
    passwordInput: {
      flex: 1,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: colors.text,
    },
    eyeBtn: {
      padding: spacing.md,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: spacing.sm,
      lineHeight: 18,
    },
    statusText: {
      fontSize: fontSize.sm,
      color: colors.success,
      marginTop: spacing.sm,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      padding: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
  }), [colors]);
}

export default function LoginScreen() {
  const { connectSite, login, loginWithBiometric } = useAuth();
  const toast = useToast();
  const { colors } = useTheme();
  const styles = useStyles();
  const [step, setStep] = useState<Step>('site');
  const [siteUrl, setSiteUrl] = useState('https://hr.welabs.dev');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteStatus, setSiteStatus] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleConnect() {
    const trimmed = siteUrl.trim();
    if (!trimmed) {
      toast.warning('Missing URL', 'Please enter your WordPress site URL');
      return;
    }

    // Auto-prepend https:// if missing
    let url = trimmed;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
      setSiteUrl(url);
    }

    setLoading(true);
    setSiteStatus('Connecting to site...');

    try {
      const result = await connectSite(url);

      if (result.error) {
        toast.error('Connection Failed', result.error);
        setSiteStatus('');
        return;
      }

      setSiteStatus('WP-ERP detected');
      setStep('login');
    } catch (error: any) {
      toast.error('Connection Failed', error?.message || 'Could not connect to site. Please check the URL.');
      setSiteStatus('');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!username || !password) {
      toast.warning('Missing Credentials', 'Please enter your username and password');
      return;
    }

    setLoading(true);
    try {
      await login(siteUrl, username, password);
    } catch (error: any) {
      const message =
        error?.response?.status === 401
          ? 'Invalid username or password'
          : error?.message || 'Login failed. Please try again.';
      toast.error('Login Failed', message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometricLogin() {
    setLoading(true);
    try {
      await loginWithBiometric();
    } catch (e: any) {
      toast.error('Biometric Failed', e?.message ?? 'Could not authenticate');
    } finally {
      setLoading(false);
    }
  }

  function handleBackToSite() {
    setStep('site');
    setUsername('');
    setPassword('');
    setSiteStatus('');
  }

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {step === 'site' ? (
          <View style={styles.form}>
            <Text style={styles.stepLabel}>Step 1: Connect Your Site</Text>

            <Text style={styles.label}>WordPress Site URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-site.com"
              placeholderTextColor={colors.textLight}
              value={siteUrl}
              onChangeText={setSiteUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
            />

            <Text style={styles.hint}>
              Enter your WordPress site URL. The site must have WP-ERP plugin
              active and HTTPS enabled.
            </Text>

            {siteStatus ? (
              <Text style={styles.statusText}>{siteStatus}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.siteInfoRow}>
              <View style={styles.siteInfoLeft}>
                <Text style={styles.stepLabel}>Step 2: Sign In</Text>
                <Text style={styles.siteUrlText} numberOfLines={1}>
                  {siteUrl}
                </Text>
              </View>
              <TouchableOpacity onPress={handleBackToSite}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Your WordPress username"
              placeholderTextColor={colors.textLight}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.6}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textLight}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.eyeBtn, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}
                onPress={handleBiometricLogin}
                disabled={loading}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="fingerprint" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              Use your WordPress login credentials to sign in.
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
