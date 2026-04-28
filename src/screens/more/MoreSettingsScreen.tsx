import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

interface SecurityItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
}

export default function MoreSettingsScreen() {
  const { colors } = useTheme();
  const s = useStyles();
  const navigation = useNavigation<any>();

  const ITEMS: SecurityItem[] = [
    {
      icon: 'cpu',
      label: 'Biometric Login',
      subtitle: 'Use fingerprint or face to sign in',
      onPress: () => Alert.alert('Biometric Login', 'Coming soon'),
    },
    {
      icon: 'lock',
      label: 'Change Password',
      subtitle: 'Update your account password',
      onPress: () => navigation.navigate('MoreChangePassword'),
    },
  ];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AppHeader showBack title="Security" />

      <View style={s.content}>
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          {ITEMS.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={s.row} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[s.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={s.rowText}>
                  <Text style={[s.label, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[s.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textLight} />
              </TouchableOpacity>
              {index < ITEMS.length - 1 && (
                <View style={[s.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
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
