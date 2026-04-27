import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import ClockFAB from '../../components/ClockFAB';

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle: string;
  screen: string;
}

const MENU: MenuItem[] = [
  { icon: 'mic',      label: 'Daily Standup',   subtitle: 'Your daily standup meeting log',  screen: 'MoreStandup' },
  { icon: 'clock',    label: 'Attendance',      subtitle: 'View your attendance',    screen: 'MoreAttendance' },
  { icon: 'credit-card', label: 'Payment Request', subtitle: 'Submit reimbursements', screen: 'MoreReimbursement' },
  { icon: 'bell',     label: 'Announcement',    subtitle: 'Read all Announcement',   screen: 'MoreAnnouncements' },
  { icon: 'users',    label: 'People',          subtitle: 'View all Employees',      screen: 'MoreTeamDirectory' },
  { icon: 'settings', label: 'Settings',        subtitle: 'Customize Your App',      screen: 'MoreSettings' },
];

export default function MoreScreen() {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {MENU.map((item) => (
            <React.Fragment key={item.screen}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textLight} />
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </React.Fragment>
          ))}

          {/* Logout */}
          <TouchableOpacity style={styles.row} onPress={logout} activeOpacity={0.7}>
            <View style={[styles.iconBadge, { backgroundColor: colors.error + '18' }]}>
              <Feather name="log-out" size={20} color={colors.error} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: colors.error }]}>Logout</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign out of your account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ClockFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
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
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44 + spacing.md * 2,
  },
});
