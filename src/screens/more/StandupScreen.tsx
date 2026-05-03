import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { getMyStandupLog, checkStandupPermission, StandupLog, StandupSummary } from '../../api/endpoints';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

    // Month nav
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginBottom: spacing.md,
    },
    monthLabel: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
    },
    navBtn: {
      padding: spacing.xs,
    },

    // Summary row
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    summaryCount: {
      fontSize: fontSize.xl,
      fontWeight: '700',
    },
    summaryLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Table
    tableCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    tableHeader: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tableHeaderCell: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    colDate: { flex: 1 },
    colDay: { width: 48, textAlign: 'center' },
    colStatus: { width: 84, textAlign: 'right' },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    cellDate: {
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },
    cellDay: {
      width: 48,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    cellStatusWrap: {
      width: 84,
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 20,
    },
    statusText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'capitalize',
    },

    // Attendance % card
    attendanceCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
    },
    attendanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    attendanceTitle: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    attendancePct: {
      fontSize: fontSize.lg,
      fontWeight: '700',
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: 8,
      borderRadius: 4,
    },

    emptyBox: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },

    fab: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
  }), [colors]);
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  present: { bg: '#D1FAE5', text: '#065F46' },
  absent:  { bg: '#FEE2E2', text: '#991B1B' },
  leave:   { bg: '#EDE9FE', text: '#5B21B6' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDayName(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr + 'T00:00:00').getDay()];
}

// ─── Skeleton ───

function SkeletonStandup() {
  const styles = useStyles();
  return (
    <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
      {/* Month nav skeleton */}
      <View style={styles.monthNav}>
        <Skeleton width={28} height={28} radius={8} />
        <Skeleton width={140} height={18} radius={6} />
        <Skeleton width={28} height={28} radius={8} />
      </View>

      {/* Summary cards skeleton */}
      <View style={styles.summaryRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.summaryCard, { backgroundColor: 'transparent' }]}>
            <Skeleton width="100%" height={80} radius={14} />
          </View>
        ))}
      </View>

      {/* Attendance % card skeleton */}
      <View style={[styles.attendanceCard, { gap: spacing.sm }]}>
        <View style={styles.attendanceRow}>
          <Skeleton width={120} height={12} radius={6} />
          <Skeleton width={48} height={20} radius={6} />
        </View>
        <Skeleton width="100%" height={8} radius={4} />
      </View>

      {/* Table card skeleton */}
      <View style={styles.tableCard}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Skeleton width={60} height={12} radius={6} style={{ flex: 1 }} />
          <Skeleton width={36} height={12} radius={6} style={{ width: 48, alignSelf: 'center' }} />
          <Skeleton width={52} height={12} radius={6} style={{ width: 84 }} />
        </View>
        {/* Rows */}
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={styles.tableRow}>
            <Skeleton width={64} height={14} radius={6} style={{ flex: 1 }} />
            <Skeleton width={28} height={14} radius={6} style={{ width: 48, alignSelf: 'center' }} />
            <Skeleton width={56} height={22} radius={11} style={{ width: 84 }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Main ───

export default function StandupScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<StandupSummary | null>(null);
  const [logs, setLogs] = useState<StandupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const res = await getMyStandupLog({ month: monthStr });
      setSummary(res.summary);
      setLogs(res.logs);
    } catch {
      setSummary({ present: 0, absent: 0, leave: 0, total: 0 });
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    checkStandupPermission().then(setCanManage);
  }, []);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    const n = new Date();
    if (year > n.getFullYear() || (year === n.getFullYear() && month >= n.getMonth() + 1)) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Daily Standup" />

      {loading ? (
        <SkeletonStandup />

      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
              <Feather name="chevron-left" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{getMonthLabel(year, month)}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={nextMonth} disabled={isCurrentMonth}>
              <Feather name="chevron-right" size={20} color={isCurrentMonth ? colors.border : colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Summary cards */}
          {summary && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: STATUS_COLORS.present.bg }]}>
                  <Text style={[styles.summaryCount, { color: STATUS_COLORS.present.text }]}>{summary.present}</Text>
                  <Text style={[styles.summaryLabel, { color: STATUS_COLORS.present.text }]}>Present</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: STATUS_COLORS.absent.bg }]}>
                  <Text style={[styles.summaryCount, { color: STATUS_COLORS.absent.text }]}>{summary.absent}</Text>
                  <Text style={[styles.summaryLabel, { color: STATUS_COLORS.absent.text }]}>Absent</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: STATUS_COLORS.leave.bg }]}>
                  <Text style={[styles.summaryCount, { color: STATUS_COLORS.leave.text }]}>{summary.leave}</Text>
                  <Text style={[styles.summaryLabel, { color: STATUS_COLORS.leave.text }]}>Leave</Text>
                </View>
              </View>

              {/* Attendance % card */}
              {(() => {
                const pct = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
                const fillColor = pct >= 75 ? colors.success : pct >= 50 ? colors.warning : colors.error;
                return (
                  <View style={styles.attendanceCard}>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceTitle}>Attendance Rate</Text>
                      <Text style={[styles.attendancePct, { color: fillColor }]}>{pct}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
                    </View>
                  </View>
                );
              })()}
            </>
          )}

          {/* Log table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
              <Text style={[styles.tableHeaderCell, styles.colDay]}>Day</Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
            </View>

            {logs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Feather name="inbox" size={36} color={colors.textLight} />
                <Text style={styles.emptyText}>No records for this month</Text>
              </View>
            ) : (
              logs.map((log, i) => {
                const scheme = STATUS_COLORS[log.status] ?? STATUS_COLORS.absent;
                return (
                  <View
                    key={log.date}
                    style={[styles.tableRow, i === logs.length - 1 && styles.tableRowLast]}
                  >
                    <Text style={styles.cellDate}>{formatDate(log.date)}</Text>
                    <Text style={styles.cellDay}>{getDayName(log.date)}</Text>
                    <View style={styles.cellStatusWrap}>
                      <View style={[styles.statusBadge, { backgroundColor: scheme.bg }]}>
                        <Text style={[styles.statusText, { color: scheme.text }]}>{log.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* FAB — only for users with erp_manage_standup */}
      {canManage && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('MoreStandupForm')}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
