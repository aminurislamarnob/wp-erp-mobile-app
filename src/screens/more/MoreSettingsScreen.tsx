import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

export default function MoreSettingsScreen() {
  const { colors } = useTheme();
  const s = useStyles();
  const navigation = useNavigation<any>();
  const toast = useToast();
  const { isBiometricEnabled, enableBiometric, disableBiometric } = useAuth();
  const [biometricLoading, setBiometricLoading] = useState(false);

  async function handleBiometricToggle(value: boolean) {
    setBiometricLoading(true);
    try {
      if (value) {
        await enableBiometric();
        toast.success('Biometric enabled', 'You can now sign in with fingerprint or face');
      } else {
        await disableBiometric();
        toast.success('Biometric disabled', 'Biometric login has been turned off');
      }
    } catch (e: any) {
      toast.error('Error', e?.message ?? 'Could not update biometric setting');
    } finally {
      setBiometricLoading(false);
    }
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AppHeader showBack title="Security" />

      <View style={s.content}>
        <View style={[s.card, { backgroundColor: colors.surface }]}>

          {/* Biometric Login */}
          <View style={s.row}>
            <View style={[s.iconBadge, { backgroundColor: colors.primary + '18' }]}>
              <MaterialCommunityIcons name="fingerprint" size={22} color={colors.primary} />
            </View>
            <View style={s.rowText}>
              <Text style={[s.label, { color: colors.text }]}>Biometric Login</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                {isBiometricEnabled ? 'Enabled — fingerprint or face' : 'Use fingerprint or face to sign in'}
              </Text>
            </View>
            {biometricLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Switch
                  value={isBiometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={isBiometricEnabled ? colors.primary : colors.textLight}
                />
            }
          </View>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          {/* Change Password */}
          <TouchableOpacity
            style={s.row}
            onPress={() => navigation.navigate('MoreChangePassword')}
            activeOpacity={0.7}
          >
            <View style={[s.iconBadge, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="lock" size={20} color={colors.primary} />
            </View>
            <View style={s.rowText}>
              <Text style={[s.label, { color: colors.text }]}>Change Password</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>Update your account password</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textLight} />
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.md },
    card: { borderRadius: 16, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    rowText: { flex: 1 },
    label: {
      fontSize: fontSize.md,
      fontWeight: '600',
      marginBottom: 2,
    },
    subtitle: { fontSize: fontSize.sm },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 44 + spacing.md * 2,
    },
  }), [colors]);
}
