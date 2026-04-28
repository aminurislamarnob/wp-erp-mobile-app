import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { useToast } from '../../components/Toast';
import { changePassword } from '../../api/endpoints';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const s = useStyles();
  const navigation = useNavigation<any>();
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!currentPassword.trim()) return toast.error('Validation', 'Current password is required');
    if (!newPassword.trim()) return toast.error('Validation', 'New password is required');
    if (newPassword.length < 8) return toast.error('Validation', 'New password must be at least 8 characters');
    if (newPassword !== confirmPassword) return toast.error('Validation', 'Passwords do not match');
    if (newPassword === currentPassword) return toast.error('Validation', 'New password must differ from current password');

    setSubmitting(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      toast.success('Success', 'Password updated successfully');
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not update password';
      toast.error('Failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.container}>
      <AppHeader showBack title="Change Password" />

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <Text style={s.label}>Current Password</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={colors.textLight}
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setShowCurrent(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={showCurrent ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={s.label}>New Password</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Minimum 8 characters"
            placeholderTextColor={colors.textLight}
            secureTextEntry={!showNew}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setShowNew(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={showNew ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Confirm New Password</Text>
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textLight}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={s.eyeBtn}
            onPress={() => setShowConfirm(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Feather name="check" size={18} color="#fff" />
          }
          <Text style={s.submitBtnText}>{submitting ? 'Updating…' : 'Update Password'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    inputRow: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.text,
      padding: 0,
      includeFontPadding: false,
    },
    eyeBtn: {
      paddingLeft: spacing.sm,
    },

    submitBtn: {
      marginTop: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    submitBtnText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '700',
    },
  }), [colors]);
}
