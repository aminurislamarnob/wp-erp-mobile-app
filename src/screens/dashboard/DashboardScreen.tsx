import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../constants/theme';
import {
  getUpcomingBirthdays,
  getWhoIsOut,
  getHolidays,
} from '../../api/endpoints';
import { Birthday, LeaveRequest, Holiday } from '../../types';

export default function DashboardScreen() {
  const { employee, logout, isModuleActive } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [whoIsOut, setWhoIsOut] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [bdays, out, hols] = await Promise.all([
        getUpcomingBirthdays().catch(() => []),
        getWhoIsOut().catch(() => []),
        getHolidays().catch(() => []),
      ]);
      setBirthdays(bdays);
      // Filter who is out today
      const today = new Date().toISOString().split('T')[0];
      setWhoIsOut(
        out.filter(
          (r) => r.start_date <= today && r.end_date >= today
        )
      );
      // Filter upcoming holidays
      setHolidays(hols.filter((h) => h.start_date >= today).slice(0, 5));
    } catch {
      // Silently fail — dashboard is best-effort
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {employee?.avatar_url ? (
            <Image source={{ uri: employee.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {employee?.first_name?.[0] || 'E'}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{employee?.full_name || 'Employee'}</Text>
            <Text style={styles.designation}>
              {employee?.designation?.title || ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction label="Leave" icon="L" />
          {isModuleActive('attendance') && (
            <QuickAction label="Attendance" icon="A" />
          )}
          {isModuleActive('document_manager') && (
            <QuickAction label="Documents" icon="D" />
          )}
          {isModuleActive('reimbursement') && (
            <QuickAction label="Reimburse" icon="R" />
          )}
          <QuickAction label="Profile" icon="P" />
        </View>
      </View>

      {/* Celebrations */}
      {birthdays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Celebrations</Text>
          {birthdays.map((b) => (
            <View key={b.id} style={styles.listItem}>
              <View style={[styles.miniAvatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={styles.miniAvatarText}>{b.name?.[0] || '?'}</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemName}>{b.name}</Text>
                <Text style={styles.listItemSub}>
                  {b.job_title} - Birthday {b.birthday}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Who is Out */}
      {whoIsOut.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who is Out</Text>
          {whoIsOut.map((r) => (
            <View key={r.id} style={styles.listItem}>
              <View style={[styles.miniAvatar, { backgroundColor: colors.warning }]}>
                <Text style={styles.miniAvatarText}>
                  {r.employee_name?.[0] || '?'}
                </Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemName}>{r.employee_name}</Text>
                <Text style={styles.listItemSub}>
                  {r.start_date} - {r.end_date}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Holidays */}
      {holidays.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Holidays</Text>
          {holidays.map((h) => (
            <View key={h.id} style={styles.listItem}>
              <View style={[styles.miniAvatar, { backgroundColor: colors.success }]}>
                <Text style={styles.miniAvatarText}>H</Text>
              </View>
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemName}>{h.name}</Text>
                <Text style={styles.listItemSub}>{h.start_date}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function QuickAction({ label, icon }: { label: string; icon: string }) {
  return (
    <TouchableOpacity style={styles.quickAction}>
      <View style={styles.quickActionIcon}>
        <Text style={styles.quickActionIconText}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.sm,
  },
  name: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  designation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
  },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionIconText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  quickActionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAvatarText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  listItemInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  listItemName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  listItemSub: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
});
