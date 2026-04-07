import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import {
  getUpcomingBirthdays,
  getWhoIsOut,
  getHolidays,
  getMyCalendarEvents,
  getSelfAttendance,
  clockInOut,
} from '../../api/endpoints';
import { Birthday, LeaveRequest, Holiday, CalendarEvent, SelfAttendance, SelfAttendanceLog } from '../../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Clock Card
    clockCard: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: 20,
      padding: spacing.lg,
      shadowColor: '#1E1B4B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    clockTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    clockTime: {
      color: '#fff',
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    clockDate: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: fontSize.sm,
      marginTop: 2,
    },
    clockIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    clockDivider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginVertical: spacing.md,
    },
    clockInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    clockInfoLabel: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: fontSize.sm,
      width: 120,
    },
    clockInfoColon: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: fontSize.sm,
      marginRight: spacing.md,
    },
    clockInfoValue: {
      color: '#fff',
      fontSize: fontSize.sm,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
    },
    clockBtnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    clockBtn: {
      flex: 1,
      backgroundColor: colors.success,
      paddingVertical: spacing.sm + 4,
      borderRadius: 24,
      alignItems: 'center',
    },
    clockBtnOut: {
      backgroundColor: colors.error,
    },
    clockBtnDisabled: {
      opacity: 0.4,
    },
    clockBtnText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '700',
    },
    clockBtnTextOut: {
      color: '#fff',
    },
    clockBtnTextDisabled: {
      opacity: 0.7,
    },

    // Sections
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: 16,
      padding: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
    },
    countBadge: {
      backgroundColor: colors.primary + '15',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: spacing.sm,
    },
    countBadgeText: {
      color: colors.primary,
      fontSize: fontSize.xs,
      fontWeight: '600',
    },

    // Quick Actions
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: spacing.md,
    },
    quickAction: {
      alignItems: 'center',
      width: 76,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    quickActionLabel: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // List Items
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
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
    listItemDate: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    loadMoreBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    loadMoreText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },

    // Calendar
    calMonthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    calArrow: {
      padding: spacing.sm,
    },
    calMonthLabel: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
    },
    calRow: {
      flexDirection: 'row',
    },
    calGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    calCell: {
      width: '14.285%',
      alignItems: 'center',
      paddingVertical: 4,
    },
    calDayHeader: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      fontWeight: '600',
    },
    calDayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    calDayToday: {
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    calDaySelected: {
      backgroundColor: colors.primary,
    },
    calDayText: {
      fontSize: fontSize.sm,
      color: colors.text,
    },
    calDayTextToday: {
      color: colors.primary,
      fontWeight: '700',
    },
    calDayTextSelected: {
      color: '#fff',
      fontWeight: '700',
    },
    calDots: {
      flexDirection: 'row',
      marginTop: 2,
      height: 6,
    },
    calDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      marginHorizontal: 1,
    },
    calEventList: {
      marginTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    calEventItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    calEventDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.sm,
    },
    calEventText: {
      fontSize: fontSize.sm,
      color: colors.text,
    },

  }), [colors]);
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { employee, user, isModuleActive } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [whoIsOut, setWhoIsOut] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [allUpcomingHolidays, setAllUpcomingHolidays] = useState<Holiday[]>([]);
  const [holidaysShown, setHolidaysShown] = useState(5);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [todayLog, setTodayLog] = useState<SelfAttendance | null>(null);
  const [attLog, setAttLog] = useState<SelfAttendanceLog | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Collapsible sections
  const [showCelebrations, setShowCelebrations] = useState(true);
  const [showWhoIsOut, setShowWhoIsOut] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Clock timer
  const [elapsed, setElapsed] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasAttendance = isModuleActive('attendance');

  const loadData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const [bdays, out, hols] = await Promise.all([
        getUpcomingBirthdays().catch(() => []),
        getWhoIsOut().catch(() => []),
        getHolidays().catch(() => []),
      ]);
      setBirthdays(bdays);
      setWhoIsOut(out.filter((r) => r.start_date <= today && r.end_date >= today));
      const upcoming = hols
        .filter((h) => h.start_date >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
      setAllUpcomingHolidays(upcoming);
      setHolidaysShown(5);
      setHolidays(upcoming.slice(0, 5));
    } catch {
      // best-effort
    }

    // Calendar events
    if (user) {
      try {
        const events = await getMyCalendarEvents(user.id, now.getFullYear());
        setCalendarEvents(events);
      } catch {
        // ignore
      }
    }

    // Today's attendance
    if (hasAttendance) {
      try {
        const res = await getSelfAttendance();
        if (res.attendance?.ds_id) {
          setTodayLog(res.attendance);
          setAttLog(res.log);
        } else {
          setTodayLog(null);
          setAttLog(null);
        }
      } catch {
        // ignore
      }
    }
    setDataLoading(false);
  }, [user, hasAttendance]);

  // Refresh data on mount and when screen is focused (e.g. navigating back)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Match Vue: check state based on max_checkout and min_checkin
  const checkedIn = todayLog?.min_checkin && todayLog.min_checkin !== '00:00:00' ? todayLog.min_checkin : '';
  const checkedOut = todayLog?.max_checkout && todayLog.max_checkout !== '00:00:00' ? todayLog.max_checkout : '';
  const isCheckedIn = !!checkedIn && !checkedOut;

  // Match Vue totalTime: log_time + (curnt_timestamp - max_checkin) + counter
  useEffect(() => {
    if (isCheckedIn && attLog) {
      const logTime = parseInt(String(attLog.log_time)) || 0;
      const curntTs = parseInt(String(attLog.curnt_timestamp)) || 0;
      const maxCheckin = parseInt(String(attLog.max_checkin)) || 0;
      const baseSeconds = logTime + (curntTs - maxCheckin);
      let counter = 0;
      const update = () => {
        counter++;
        const total = baseSeconds + counter;
        if (total > 0) {
          const h = String(Math.floor(total / 3600)).padStart(2, '0');
          const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
          const s = String(total % 60).padStart(2, '0');
          setElapsed(`${h}:${m}:${s}`);
        }
      };
      update();
      timerRef.current = setInterval(update, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsed('00:00:00');
    }
  }, [isCheckedIn, attLog]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleClockInOut() {
    const action = isCheckedIn ? 'checkout' : 'checkin';
    setClockLoading(true);
    let success = false;
    try {
      await clockInOut(action);
      success = true;
    } catch (err: any) {
      const msg = err?.response?.data?.data || err?.response?.data?.message || err?.message || 'Clock action failed';
      toast.error('Clock Failed', typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    // Wait briefly for DB to flush, then refresh state
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await getSelfAttendance();
      if (res.attendance?.ds_id) {
        setTodayLog(res.attendance);
        setAttLog(res.log);
      } else {
        setTodayLog(null);
        setAttLog(null);
      }
    } catch {
      // ignore refresh error
    }
    if (success) {
      toast.success(
        action === 'checkin' ? 'Checked In' : 'Checked Out',
        action === 'checkin' ? 'You have been clocked in successfully' : 'You have been clocked out successfully'
      );
    }
    setClockLoading(false);
  }

  // Calendar helpers
  function getDaysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(month: number, year: number) {
    return new Date(year, month, 1).getDay();
  }

  function getEventsForDate(dateStr: string): CalendarEvent[] {
    return calendarEvents.filter((e) => e.start.slice(0, 10) <= dateStr && e.end.slice(0, 10) >= dateStr);
  }

  function hasEventOnDate(dateStr: string): { leave: boolean; holiday: boolean } {
    const events = getEventsForDate(dateStr);
    return {
      leave: events.some((e) => !e.holiday),
      holiday: events.some((e) => e.holiday),
    };
  }

  function formatDateStr(day: number): string {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  }

  // Live clock
  const [currentTime, setCurrentTime] = useState(() => formatLiveClock());
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(formatLiveClock()), 1000);
    return () => clearInterval(id);
  }, []);

  const nowDate = new Date();
  const dateLabel = nowDate.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    weekday: 'long',
  });

  // Shift time display — use attLog.start_time/end_time (time only, not full datetime)
  const shiftStart = attLog?.start_time ? formatTime12h(attLog.start_time) : '--:--';
  const shiftEnd = attLog?.end_time ? formatTime12h(attLog.end_time) : '--:--';

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Calendar grid
  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AppHeader />

      {/* ─── Clock In/Out Card ─── */}
      {hasAttendance && (() => {
        const clockContent = dataLoading ? (
          <>
            {/* Skeleton: time + icon */}
            <View style={styles.clockTopRow}>
              <View>
                <Skeleton width={160} height={28} />
                <Skeleton width={200} height={12} style={{ marginTop: 8 }} />
              </View>
              <Skeleton width={48} height={48} radius={24} />
            </View>

            <View style={styles.clockDivider} />

            {/* Skeleton: info rows */}
            <View style={styles.clockInfoRow}>
              <Skeleton width={80} height={13} />
              <Skeleton width={100} height={13} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.clockInfoRow}>
              <Skeleton width={70} height={13} />
              <Skeleton width={120} height={13} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.clockInfoRow}>
              <Skeleton width={85} height={13} />
              <Skeleton width={80} height={13} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.clockInfoRow}>
              <Skeleton width={110} height={13} />
              <Skeleton width={70} height={13} style={{ marginLeft: 'auto' }} />
            </View>

            {/* Skeleton: buttons */}
            <View style={styles.clockBtnRow}>
              <Skeleton width="48%" height={40} radius={24} />
              <Skeleton width="48%" height={40} radius={24} />
            </View>
          </>
        ) : (
          <>
            {/* Top section: time + weather icon area */}
            <View style={styles.clockTopRow}>
              <View>
                <Text style={styles.clockTime}>{currentTime}</Text>
                <Text style={styles.clockDate}>{dateLabel}</Text>
              </View>
              <View style={styles.clockIconWrap}>
                <Feather
                  name={new Date().getHours() >= 18 || new Date().getHours() < 6 ? 'moon' : 'sun'}
                  size={28}
                  color={new Date().getHours() >= 18 || new Date().getHours() < 6 ? '#E2E8F0' : '#FDB813'}
                />
              </View>
            </View>

            <View style={styles.clockDivider} />

            {/* Info rows */}
            <View style={styles.clockInfoRow}>
              <Text style={styles.clockInfoLabel}>Shift</Text>
              <Text style={styles.clockInfoColon}>:</Text>
              <Text style={styles.clockInfoValue}>{todayLog?.shift_title || '--'}</Text>
            </View>
            <View style={styles.clockInfoRow}>
              <Text style={styles.clockInfoLabel}>Schedule</Text>
              <Text style={styles.clockInfoColon}>:</Text>
              <Text style={styles.clockInfoValue}>{shiftStart} - {shiftEnd}</Text>
            </View>
            <View style={styles.clockInfoRow}>
              <Text style={styles.clockInfoLabel}>Checked-in</Text>
              <Text style={styles.clockInfoColon}>:</Text>
              <Text style={styles.clockInfoValue}>
                {checkedIn ? formatTime12h(checkedIn) : '00:00:00'}
              </Text>
            </View>

            {/* Bottom: working time + button */}
            <View style={styles.clockInfoRow}>
              <Text style={styles.clockInfoLabel}>Today Work Time</Text>
              <Text style={styles.clockInfoColon}>:</Text>
              <Text style={styles.clockInfoValue}>{elapsed}</Text>
            </View>
            <View style={styles.clockBtnRow}>
              <TouchableOpacity
                style={[styles.clockBtn, isCheckedIn && styles.clockBtnDisabled]}
                onPress={() => !isCheckedIn && handleClockInOut()}
                disabled={clockLoading || isCheckedIn}
              >
                <Text style={[styles.clockBtnText, isCheckedIn && styles.clockBtnTextDisabled]}>
                  {clockLoading && !isCheckedIn ? '...' : 'Check-in'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.clockBtn, styles.clockBtnOut, !isCheckedIn && styles.clockBtnDisabled]}
                onPress={() => isCheckedIn && handleClockInOut()}
                disabled={clockLoading || !isCheckedIn}
              >
                <Text style={[styles.clockBtnText, styles.clockBtnTextOut, !isCheckedIn && styles.clockBtnTextDisabled]}>
                  {clockLoading && isCheckedIn ? '...' : 'Check-out'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

        return isDark ? (
          <LinearGradient
            colors={['#1E1B4B', '#312E81', '#3730A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.clockCard}
          >
            {clockContent}
          </LinearGradient>
        ) : (
          <View style={[styles.clockCard, { backgroundColor: colors.primary }]}>
            {clockContent}
          </View>
        );
      })()}

      {/* ─── Quick Actions ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            label="Leave"
            iconName="send"
            bgColor={colors.primaryLight + '20'}
            iconColor={colors.primary}
            onPress={() => navigation.navigate('Leave')}
          />
          {hasAttendance && (
            <QuickAction
              label="Attendance"
              iconName="clock"
              bgColor={colors.info + '20'}
              iconColor={colors.info}
              onPress={() => navigation.navigate('Attendance')}
            />
          )}
{isModuleActive('reimbursement') && (
            <QuickAction
              label="Reimburse"
              iconName="dollar-sign"
              bgColor={colors.warning + '20'}
              iconColor={colors.warning}
            />
          )}
          <QuickAction
            label="News"
            iconName="volume-2"
            bgColor={colors.success + '20'}
            iconColor={colors.success}
            onPress={() => navigation.navigate('Announcements')}
          />
          <QuickAction
            label="Profile"
            iconName="user"
            bgColor={colors.primaryLight + '20'}
            iconColor={colors.primaryDark}
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </View>

      {/* ─── Celebrations ─── */}
      <CollapsibleSection
        title="Upcoming Birthdays"
        count={birthdays.length}
        expanded={showCelebrations}
        onToggle={() => setShowCelebrations(!showCelebrations)}
      >
        {birthdays.length > 0 ? (
          birthdays.map((b) => (
            <View key={b.id} style={styles.listItem}>
              {b.avatar ? (
                <Image source={{ uri: extractAvatarUrl(b.avatar) }} style={styles.miniAvatar} />
              ) : (
                <View style={[styles.miniAvatar, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.miniAvatarText}>{b.name?.[0] || '?'}</Text>
                </View>
              )}
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemName}>{b.name}</Text>
                <Text style={styles.listItemSub}>
                  {b.job_title}{b.department_title ? ` · ${b.department_title}` : ''}
                </Text>
              </View>
              <Text style={styles.listItemDate}>{b.birthday}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming birthdays</Text>
        )}
      </CollapsibleSection>

      {/* ─── Who is Out ─── */}
      <CollapsibleSection
        title="Who is out"
        count={whoIsOut.length}
        expanded={showWhoIsOut}
        onToggle={() => setShowWhoIsOut(!showWhoIsOut)}
      >
        {whoIsOut.length > 0 ? (
          whoIsOut.map((r) => (
            <View key={r.id} style={styles.listItem}>
              {r.avatar_url ? (
                <Image source={{ uri: r.avatar_url }} style={styles.miniAvatar} />
              ) : (
                <View style={[styles.miniAvatar, { backgroundColor: colors.warning }]}>
                  <Text style={styles.miniAvatarText}>{r.employee_name?.[0] || '?'}</Text>
                </View>
              )}
              <View style={styles.listItemInfo}>
                <Text style={styles.listItemName}>{r.employee_name}</Text>
                <Text style={styles.listItemSub}>
                  {r.start_date} - {r.end_date}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Everyone is in today</Text>
        )}
      </CollapsibleSection>

      {/* ─── Holidays ─── */}
      <CollapsibleSection
        title="Holidays"
        count={holidays.length}
        expanded={showHolidays}
        onToggle={() => setShowHolidays(!showHolidays)}
      >
        {dataLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.listItem}>
              <Skeleton width={36} height={36} radius={18} />
              <View style={styles.listItemInfo}>
                <Skeleton width={140} height={14} />
                <Skeleton width={90} height={12} style={{ marginTop: 4 }} />
              </View>
            </View>
          ))
        ) : holidays.length > 0 ? (
          <>
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
            {holidaysShown < allUpcomingHolidays.length && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => {
                  const next = holidaysShown + 5;
                  setHolidaysShown(next);
                  setHolidays(allUpcomingHolidays.slice(0, next));
                }}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>No upcoming holidays</Text>
        )}
      </CollapsibleSection>

      {/* ─── Calendar ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calendar</Text>

        {/* Month navigation */}
        <View style={styles.calMonthRow}>
          <TouchableOpacity onPress={prevMonth} style={styles.calArrow}>
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.calMonthLabel}>
            {MONTHS[calMonth]} {calYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.calArrow}>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={styles.calRow}>
          {DAYS.map((d) => (
            <View key={d} style={styles.calCell}>
              <Text style={styles.calDayHeader}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calGrid}>
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.calCell} />;
            }
            const dateStr = formatDateStr(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const eventInfo = hasEventOnDate(dateStr);

            return (
              <TouchableOpacity
                key={dateStr}
                style={styles.calCell}
                onPress={() => setSelectedDate(isSelected ? null : dateStr)}
              >
                <View
                  style={[
                    styles.calDayCircle,
                    isToday && styles.calDayToday,
                    isSelected && styles.calDaySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.calDayText,
                      isToday && styles.calDayTextToday,
                      isSelected && styles.calDayTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={styles.calDots}>
                  {eventInfo.leave && <View style={[styles.calDot, { backgroundColor: colors.primary }]} />}
                  {eventInfo.holiday && <View style={[styles.calDot, { backgroundColor: colors.success }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected date events */}
        {selectedDate && selectedEvents.length > 0 && (
          <View style={styles.calEventList}>
            {selectedEvents.map((e) => (
              <View key={e.id} style={styles.calEventItem}>
                <View style={[styles.calEventDot, { backgroundColor: e.color || (e.holiday ? colors.success : colors.primary) }]} />
                <Text style={styles.calEventText}>{e.title}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>

    </View>
  );
}

// ─── Helper Components ───

function QuickAction({
  label,
  iconName,
  bgColor,
  iconColor,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Feather.glyphMap;
  bgColor: string;
  iconColor: string;
  onPress?: () => void;
}) {
  const styles = useStyles();
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Feather name={iconName} size={22} color={iconColor} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function CollapsibleSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{count}</Text>
            </View>
          )}
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textLight} />
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
}

function formatLiveClock(): string {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${m}:${s} ${ampm}`;
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return '--:--';
  // Already formatted (contains AM/PM) — return as-is
  if (/am|pm/i.test(timeStr)) return timeStr.trim();
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function extractAvatarUrl(avatarHtml: string): string {
  const match = avatarHtml.match(/src=['"]([^'"]+)['"]/);
  return match ? match[1] : '';
}
