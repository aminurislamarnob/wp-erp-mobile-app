import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeMode } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle: string;
  screen: string;
  parent?: string;
}

const MENU: MenuItem[] = [
  { icon: 'mic',         label: 'Daily Standup',   subtitle: 'Your daily standup meeting log', screen: 'MoreStandup' },
  { icon: 'clock',       label: 'Attendance',      subtitle: 'View your attendance',           screen: 'MoreAttendance' },
  { icon: 'credit-card', label: 'Payment Request', subtitle: 'Submit reimbursements',          screen: 'MoreReimbursement' },
  { icon: 'bell',        label: 'Announcement',    subtitle: 'Read all Announcement',          screen: 'MoreAnnouncements' },
  { icon: 'edit-3',      label: 'My Notes',        subtitle: 'Personal notes & labels',        screen: 'Notes',         parent: 'root' },
  { icon: 'tag',         label: 'Labels',          subtitle: 'Manage your note labels',        screen: 'MoreLabelManager' },
  { icon: 'users',       label: 'People',          subtitle: 'View all Employees',             screen: 'MoreTeamDirectory' },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light',  label: 'Light' },
  { value: 'dark',   label: 'Dark' },
];

function themeModeLabel(mode: ThemeMode): string {
  if (mode === 'system') return 'System Default';
  if (mode === 'light') return 'Light';
  return 'Dark';
}

function themeIcon(mode: ThemeMode): keyof typeof Feather.glyphMap {
  if (mode === 'light') return 'sun';
  if (mode === 'dark') return 'moon';
  return 'smartphone';
}

const SELECTOR_HEIGHT = 52;

export default function MoreScreen() {
  const { colors, mode, setMode } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const s = useStyles();

  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (expanded) {
      Animated.parallel([
        Animated.spring(animHeight, {
          toValue: SELECTOR_HEIGHT,
          useNativeDriver: false,
          bounciness: 4,
          speed: 14,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.spring(chevronAnim, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 6,
          speed: 16,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(animHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.spring(chevronAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
          speed: 16,
        }),
      ]).start();
    }
  }, [expanded]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <AppHeader title="More" />

      <View style={s.content}>
        <View style={[s.card, { backgroundColor: colors.surface }]}>
          {MENU.map((item) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity
                style={s.row}
                onPress={() => {
                  if (item.parent === 'root') {
                    navigation.getParent()?.navigate(item.screen);
                  } else {
                    navigation.navigate(item.screen);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[s.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={s.rowText}>
                  <Text style={[s.label, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[s.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textLight} />
              </TouchableOpacity>
              <View style={[s.divider, { backgroundColor: colors.border }]} />
            </React.Fragment>
          ))}

          {/* Theme */}
          <TouchableOpacity
            style={s.row}
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[s.iconBadge, { backgroundColor: colors.primary + '18' }]}>
              <Feather name={themeIcon(mode)} size={20} color={colors.primary} />
            </View>
            <View style={s.rowText}>
              <Text style={[s.label, { color: colors.text }]}>Theme</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>{themeModeLabel(mode)}</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
              <Feather name="chevron-down" size={18} color={colors.textLight} />
            </Animated.View>
          </TouchableOpacity>

          <Animated.View style={{ height: animHeight, opacity: animOpacity, overflow: 'hidden' }}>
            <View style={[s.themeSelector, { borderTopColor: colors.border }]}>
              {THEME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    s.themeOption,
                    opt.value === mode
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.background },
                  ]}
                  onPress={() => setMode(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.themeOptionText, { color: opt.value === mode ? '#fff' : colors.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          {/* Security */}
          <TouchableOpacity
            style={s.row}
            onPress={() => navigation.navigate('MoreSettings')}
            activeOpacity={0.7}
          >
            <View style={[s.iconBadge, { backgroundColor: colors.primary + '18' }]}>
              <Feather name="shield" size={20} color={colors.primary} />
            </View>
            <View style={s.rowText}>
              <Text style={[s.label, { color: colors.text }]}>Security</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>Manage your account security</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.textLight} />
          </TouchableOpacity>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          {/* Logout */}
          <TouchableOpacity style={s.row} onPress={logout} activeOpacity={0.7}>
            <View style={[s.iconBadge, { backgroundColor: colors.error + '18' }]}>
              <Feather name="log-out" size={20} color={colors.error} />
            </View>
            <View style={s.rowText}>
              <Text style={[s.label, { color: colors.error }]}>Logout</Text>
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>Sign out of your account</Text>
            </View>
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
    content: { flex: 1, padding: spacing.md },
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
    themeSelector: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
      gap: 6,
    },
    themeOption: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      borderRadius: 8,
    },
    themeOptionText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
  }), [colors]);
}
