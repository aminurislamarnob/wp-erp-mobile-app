import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/Toast';
import {
  getSelfAttendance,
  clockInOut,
  getMyAttendanceReport,
} from '../../api/endpoints';
import { SelfAttendance, SelfAttendanceLog, AttendanceReportDay } from '../../types';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

type Tab = 'clock' | 'log' | 'report';

const TABS: { key: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'clock', label: 'Clock', icon: 'clock' },
  { key: 'log', label: 'Log', icon: 'calendar' },
  { key: 'report', label: 'Report', icon: 'bar-chart-2' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function useStatusColors() {
  const { colors } = useTheme();
  return React.useMemo<Record<string, string>>(() => ({
    present: colors.success,
    absent: colors.error,
    holiday: colors.info,
    leave: '#8B5CF6',
  }), [colors]);
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xl * 2,
    },

    // Tabs
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
    },
    tabItemActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabLabel: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      fontWeight: '500',
    },
    tabLabelActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    // Clock card
    clockCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    clockTime: {
      fontSize: 36,
      fontWeight: '700',
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    clockDate: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },

    // Info card
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    infoLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },

    // Status row
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    statusLabel: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    statusTime: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.text,
    },
    statusDivider: {
      width: 1,
      height: 48,
      backgroundColor: colors.border,
    },
    elapsedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    elapsedText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },

    // Clock button
    clockBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 18,
      borderRadius: 16,
      marginTop: spacing.sm,
    },
    clockInBtn: {
      backgroundColor: colors.success,
    },
    clockOutBtn: {
      backgroundColor: colors.error,
    },
    clockBtnText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: '#fff',
    },

    // Month nav
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    monthArrow: {
      padding: spacing.sm,
    },
    monthLabel: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.text,
    },

    // Calendar
    calendarLoading: {
      paddingVertical: spacing.xl * 2,
      alignItems: 'center',
    },
    calendarRow: {
      flexDirection: 'row',
    },
    calendarCell: {
      width: '14.285%' as any,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },
    calendarCellSelected: {
      backgroundColor: colors.primary + '20',
      borderRadius: 10,
    },
    calendarCellToday: {
      backgroundColor: colors.primaryLight + '15',
      borderRadius: 10,
    },
    dayHeader: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    calendarDay: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: '500',
    },
    calendarDaySelected: {
      color: colors.primary,
      fontWeight: '700',
    },
    calendarDayToday: {
      color: colors.primary,
      fontWeight: '700',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 3,
    },

    // Legend
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },

    // Day detail
    dayDetailGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    dayDetailItem: {
      width: '30%' as any,
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.sm,
    },
    dayDetailLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    dayDetailValue: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },

    // Section label
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },

    // Summary grid
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    summaryCard: {
      width: '31%' as any,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      alignItems: 'center',
      gap: 6,
    },
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
    },
    summaryLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },

    // Section title
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },

    // Day row (report)
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    dayRowLeft: {
      width: 70,
    },
    dayRowDate: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },
    dayRowShift: {
      fontSize: 10,
      color: colors.textLight,
      marginTop: 2,
    },
    dayRowCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    dayRowTime: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    dayRowRight: {
      alignItems: 'flex-end',
      width: 70,
    },
    dayRowHours: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.primary,
    },
    dayRowLate: {
      fontSize: 10,
      color: colors.warning,
      marginTop: 2,
    },
  }), [colors]);
}

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const [tab, setTab] = useState<Tab>('clock');

  return (
    <View style={styles.container}>
      <AppHeader />
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key)}
          >
            <Feather
              name={t.icon}
              size={18}
              color={tab === t.key ? colors.primary : colors.textLight}
            />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'clock' && <ClockTab userId={user?.id} />}
      {tab === 'log' && <LogTab userId={user?.id} />}
      {tab === 'report' && <ReportTab userId={user?.id} />}
    </View>
  );
}

// ─── Clock Tab ───

function ClockTab({ userId }: { userId?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [attendance, setAttendance] = useState<SelfAttendance | null>(null);
  const [log, setLog] = useState<SelfAttendanceLog | null>(null);
  const [shiftExist, setShiftExist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [now, setNow] = useState(new Date());
  const [counter, setCounter] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getSelfAttendance();
      // Match Vue: if ds_id exists, shift is assigned
      if (res.attendance?.ds_id) {
        setAttendance(res.attendance);
        setLog(res.log);
        setShiftExist(true);

        // Match Vue: determine checked-in state
        if (res.attendance.max_checkout === '00:00:00' && res.attendance.min_checkin !== '00:00:00') {
          // Currently checked in — start counter
          setCounter(0);
          if (counterRef.current) clearInterval(counterRef.current);
          counterRef.current = setInterval(() => setCounter((c) => c + 1), 1000);
        } else {
          // Not checked in or already checked out
          setCounter(0);
          if (counterRef.current) clearInterval(counterRef.current);
        }
      } else {
        setShiftExist(false);
        setAttendance(null);
        setLog(null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, []);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Match Vue logic: max_checkout == '00:00:00' && min_checkin != '00:00:00' → checked in
  const checkedInTime = attendance?.min_checkin && attendance.min_checkin !== '00:00:00' ? attendance.min_checkin : '';
  const checkedOutTime = attendance?.max_checkout && attendance.max_checkout !== '00:00:00' ? attendance.max_checkout : '';
  const isClockedIn = !!checkedInTime && !checkedOutTime;

  const handleClockInOut = async () => {
    const action = isClockedIn ? 'checkout' : 'checkin';
    setClocking(true);
    let success = false;
    try {
      await clockInOut(action);
      success = true;
    } catch (err: any) {
      const msg = err?.response?.data?.data || err?.response?.data?.message || err?.message || 'Clock action failed';
      toast.error('Clock Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    // Wait briefly for DB to flush, then refresh state
    await new Promise((r) => setTimeout(r, 1500));
    await fetchData();
    if (success) {
      toast.success(
        action === 'checkin' ? 'Checked In' : 'Checked Out',
        action === 'checkin' ? 'You have been clocked in successfully' : 'You have been clocked out successfully'
      );
    }
    setClocking(false);
  };

  // Match Vue totalTime: log_time + (curnt_timestamp - max_checkin) + counter
  let elapsed = '';
  if (isClockedIn && log) {
    const logTime = parseInt(String(log.log_time)) || 0;
    const curntTs = parseInt(String(log.curnt_timestamp)) || 0;
    const maxCheckin = parseInt(String(log.max_checkin)) || 0;
    const totalSeconds = logTime + (curntTs - maxCheckin) + counter;
    if (totalSeconds > 0) {
      elapsed = formatSecondsHMS(totalSeconds);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Current Time */}
      <View style={styles.clockCard}>
        <Text style={styles.clockTime}>
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </Text>
        <Text style={styles.clockDate}>
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>

      {/* Shift Info */}
      {attendance?.shift_title ? (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="briefcase" size={16} color={colors.primary} />
            <Text style={styles.infoLabel}>Shift</Text>
            <Text style={styles.infoValue}>{attendance.shift_title}</Text>
          </View>
          {log?.start_time && log?.end_time ? (
            <View style={styles.infoRow}>
              <Feather name="clock" size={16} color={colors.primary} />
              <Text style={styles.infoLabel}>Schedule</Text>
              <Text style={styles.infoValue}>
                {formatTime12h(log.start_time)} – {formatTime12h(log.end_time)}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Check-in/out status */}
      <View style={styles.infoCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Feather name="log-in" size={20} color={colors.success} />
            <Text style={styles.statusLabel}>Check In</Text>
            <Text style={styles.statusTime}>
              {checkedInTime ? formatTime12h(checkedInTime) : '--:--'}
            </Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Feather name="log-out" size={20} color={colors.error} />
            <Text style={styles.statusLabel}>Check Out</Text>
            <Text style={styles.statusTime}>
              {checkedOutTime ? formatTime12h(checkedOutTime) : '--:--'}
            </Text>
          </View>
        </View>

        {elapsed ? (
          <View style={styles.elapsedRow}>
            <Feather name="activity" size={14} color={colors.primary} />
            <Text style={styles.elapsedText}>Working: {elapsed}</Text>
          </View>
        ) : null}
      </View>

      {/* Clock Button */}
      <TouchableOpacity
        style={[styles.clockBtn, isClockedIn ? styles.clockOutBtn : styles.clockInBtn]}
        onPress={handleClockInOut}
        disabled={clocking}
        activeOpacity={0.8}
      >
        {clocking ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather
              name={isClockedIn ? 'log-out' : 'log-in'}
              size={24}
              color="#fff"
            />
            <Text style={styles.clockBtnText}>
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Log Tab (Calendar) ───

function LogTab({ userId }: { userId?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const STATUS_COLORS = useStatusColors();
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [report, setReport] = useState<AttendanceReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const start = `${year}-${pad(month + 1)}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
      const data = await getMyAttendanceReport(userId, start, end);
      setReport(Array.isArray(data) ? data : []);
    } catch {
      setReport([]);
    } finally {
      setLoading(false);
    }
  }, [userId, monthDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  const reportMap = new Map<string, AttendanceReportDay>();
  report.forEach((r) => {
    const key = r.date?.split(' ')[0]; // handle "2026-03-01 00:00:00"
    if (key) reportMap.set(key, r);
  });

  const prevMonth = () => setMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setMonthDate(new Date(year, month + 1, 1));

  const selectedDay = selectedDate ? reportMap.get(selectedDate) : null;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Month Nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
          <Feather name="chevron-right" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.calendarLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Day headers */}
          <View style={styles.calendarRow}>
            {DAY_LABELS.map((d) => (
              <View key={d} style={styles.calendarCell}>
                <Text style={styles.dayHeader}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {renderCalendarGrid(
            daysInMonth,
            firstDow,
            year,
            month,
            reportMap,
            selectedDate,
            setSelectedDate,
            styles,
            STATUS_COLORS
          )}

          {/* Legend */}
          <View style={styles.legend}>
            {Object.entries(STATUS_COLORS).map(([key, color]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{key}</Text>
              </View>
            ))}
          </View>

          {/* Selected day details */}
          {selectedDay && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>
                {formatDateDisplay(selectedDate!)}
              </Text>
              <View style={styles.dayDetailGrid}>
                <DayDetailItem icon="log-in" label="Check In" value={formatSecToTime12h(Number(selectedDay.checkin))} />
                <DayDetailItem icon="log-out" label="Check Out" value={formatSecToTime12h(Number(selectedDay.checkout))} />
                <DayDetailItem icon="clock" label="Work Hours" value={formatSecToHours(Number(selectedDay.worktime))} />
                <DayDetailItem icon="alert-triangle" label="Late" value={selectedDay.late_time ? formatSecToHours(Number(selectedDay.late_time)) : '-'} />
                <DayDetailItem icon="trending-up" label="Overtime" value={selectedDay.overtime ? formatSecToHours(Number(selectedDay.overtime)) : '-'} />
                <DayDetailItem icon="briefcase" label="Shift" value={selectedDay.shift || '-'} />
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function renderCalendarGrid(
  daysInMonth: number,
  firstDow: number,
  year: number,
  month: number,
  reportMap: Map<string, AttendanceReportDay>,
  selectedDate: string | null,
  setSelectedDate: (d: string | null) => void,
  styles: ReturnType<typeof useStyles>,
  STATUS_COLORS: Record<string, string>
) {
  const rows: React.ReactNode[] = [];
  let cells: React.ReactNode[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDow; i++) {
    cells.push(<View key={`empty-${i}`} style={styles.calendarCell} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    const dayData = reportMap.get(dateStr);
    const status = dayData?.status?.toLowerCase() || '';
    const dotColor = STATUS_COLORS[status] || 'transparent';
    const isSelected = selectedDate === dateStr;
    const isToday = isSameDay(new Date(), new Date(year, month, day));

    cells.push(
      <TouchableOpacity
        key={dateStr}
        style={[
          styles.calendarCell,
          isSelected && styles.calendarCellSelected,
          isToday && !isSelected && styles.calendarCellToday,
        ]}
        onPress={() => setSelectedDate(isSelected ? null : dateStr)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.calendarDay,
            isSelected && styles.calendarDaySelected,
            isToday && !isSelected && styles.calendarDayToday,
          ]}
        >
          {day}
        </Text>
        {dotColor !== 'transparent' && (
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        )}
      </TouchableOpacity>
    );

    if ((firstDow + day) % 7 === 0 || day === daysInMonth) {
      // Pad remaining cells in last row
      if (day === daysInMonth) {
        const remaining = 7 - cells.length;
        for (let i = 0; i < remaining; i++) {
          cells.push(<View key={`pad-${i}`} style={styles.calendarCell} />);
        }
      }
      rows.push(
        <View key={`row-${day}`} style={styles.calendarRow}>
          {cells}
        </View>
      );
      cells = [];
    }
  }

  return rows;
}

// ─── Report Tab ───

function ReportTab({ userId }: { userId?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [report, setReport] = useState<AttendanceReportDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!userId) return;
    try {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const start = `${year}-${pad(month + 1)}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
      const data = await getMyAttendanceReport(userId, start, end);
      setReport(Array.isArray(data) ? data : []);
    } catch {
      setReport([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, monthDate]);

  useEffect(() => {
    setLoading(true);
    fetchReport();
  }, [fetchReport]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const prevMonth = () => setMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setMonthDate(new Date(year, month + 1, 1));

  // Compute summary
  const presentDays = report.filter((r) => r.status?.toLowerCase() === 'present').length;
  const absentDays = report.filter((r) => r.status?.toLowerCase() === 'absent').length;
  const lateDays = report.filter((r) => r.late_time && Number(r.late_time) > 0).length;
  const totalWorkSec = report.reduce((sum, r) => sum + (Number(r.worktime) || 0), 0);
  const totalOvertimeSec = report.reduce((sum, r) => sum + (Number(r.overtime) || 0), 0);
  const workingDays = report.filter((r) => {
    const s = r.status?.toLowerCase();
    return s === 'present' || s === 'absent' || s === 'late';
  }).length;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReport(); }} />
      }
    >
      {/* Month Nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
          <Feather name="chevron-right" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.calendarLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <SummaryCard icon="check-circle" label="Present" value={String(presentDays)} color={colors.success} />
            <SummaryCard icon="x-circle" label="Absent" value={String(absentDays)} color={colors.error} />
            <SummaryCard icon="alert-triangle" label="Late" value={String(lateDays)} color={colors.warning} />
            <SummaryCard icon="clock" label="Work Hours" value={formatSecToHours(totalWorkSec)} color={colors.primary} />
            <SummaryCard icon="trending-up" label="Overtime" value={formatSecToHours(totalOvertimeSec)} color={colors.info} />
            <SummaryCard icon="percent" label="Attendance" value={workingDays > 0 ? `${Math.round((presentDays / workingDays) * 100)}%` : '-'} color={colors.primaryDark} />
          </View>

          {/* Daily Breakdown */}
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {report.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={36} color={colors.textLight} />
              <Text style={styles.emptyText}>No attendance data for this month</Text>
            </View>
          ) : (
            report
              .filter((r) => r.status?.toLowerCase() === 'present')
              .map((r) => {
                const dateKey = r.date?.split(' ')[0] || r.date;
                return (
                  <View key={dateKey} style={styles.dayRow}>
                    <View style={styles.dayRowLeft}>
                      <Text style={styles.dayRowDate}>{formatDateShort(dateKey)}</Text>
                      <Text style={styles.dayRowShift}>{r.shift || ''}</Text>
                    </View>
                    <View style={styles.dayRowCenter}>
                      <Text style={styles.dayRowTime}>{formatSecToTime12h(Number(r.checkin))}</Text>
                      <Feather name="arrow-right" size={12} color={colors.textLight} />
                      <Text style={styles.dayRowTime}>{formatSecToTime12h(Number(r.checkout))}</Text>
                    </View>
                    <View style={styles.dayRowRight}>
                      <Text style={styles.dayRowHours}>{formatSecToHours(Number(r.worktime))}</Text>
                      {r.late_time && Number(r.late_time) > 0 ? (
                        <Text style={styles.dayRowLate}>Late {formatSecToHours(Number(r.late_time))}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
          )}
        </>
      )}
    </ScrollView>
  );
}

// ─── Reusable Components ───

function SummaryCard({ icon, label, value, color }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function DayDetailItem({ icon, label, value }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.dayDetailItem}>
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={styles.dayDetailLabel}>{label}</Text>
      <Text style={styles.dayDetailValue}>{value}</Text>
    </View>
  );
}

// ─── Helpers ───

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatSecondsHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatSecToTime12h(seconds: number): string {
  if (!seconds) return '--:--';
  const totalMin = Math.floor(seconds / 60);
  let h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ampm}`;
}

function formatSecToHours(seconds: number): string {
  if (!seconds) return '0h';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function parseTodayTime(timeStr: string): Date | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(parts[0], 10), parseInt(parts[1] || '0', 10), parseInt(parts[2] || '0', 10), 0);
  return d;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
