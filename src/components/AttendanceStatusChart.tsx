import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Skeleton } from './Skeleton';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getMyAttendanceReport, getMyStandupLog } from '../api/endpoints';
import { spacing, fontSize } from '../constants/theme';
import { AttendanceReportDay } from '../types';

// ─── Constants ───

const ATT_COLORS = { inTime: '#3EEE95', late: '#FFAA73', absent: '#EF0155' };
const STD_COLORS = { present: '#3EEE95', leave: '#FFAA73', absent: '#EF0155' };

type ChartTab = 'attendance' | 'standup';
type Filter = 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

const FILTER_LABELS: Record<Filter, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
};
const FILTERS: Filter[] = ['this_month', 'last_month', 'this_quarter', 'this_year'];

// ─── Helpers ───

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getDateRange(filter: Filter): { startDate: string; endDate: string } {
  const now = new Date();
  const today = todayStr();

  if (filter === 'this_month') {
    const y = now.getFullYear(), m = now.getMonth();
    return { startDate: `${y}-${pad(m + 1)}-01`, endDate: today };
  }

  if (filter === 'last_month') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = d.getFullYear(), m = d.getMonth();
    return {
      startDate: `${y}-${pad(m + 1)}-01`,
      endDate: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`,
    };
  }

  if (filter === 'this_quarter') {
    const y = now.getFullYear();
    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
    return { startDate: `${y}-${pad(quarterStart + 1)}-01`, endDate: today };
  }

  return { startDate: `${now.getFullYear()}-01-01`, endDate: today };
}

function getStandupParams(filter: Filter) {
  const now = new Date();
  const today = todayStr();

  if (filter === 'this_month') {
    return { month: `${now.getFullYear()}-${pad(now.getMonth() + 1)}` };
  }

  if (filter === 'last_month') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` };
  }

  if (filter === 'this_quarter') {
    const y = now.getFullYear();
    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
    return { from: `${y}-${pad(quarterStart + 1)}-01`, to: today };
  }

  return { from: `${now.getFullYear()}-01-01`, to: today };
}

function computeAttStats(report: AttendanceReportDay[]) {
  let inTime = 0, late = 0, absent = 0;
  report.forEach((r) => {
    const status = r.status?.toLowerCase() || '';
    const isLate = r.late_time && Number(r.late_time) > 0;
    if (status === 'absent') absent++;
    else if (isLate) late++;
    else if (status === 'present') inTime++;
  });
  return { inTime, late, absent };
}

// ─── Styles ───

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: 16,
      padding: spacing.md,
    },

    // Chart tabs
    tabRow: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 3,
      marginBottom: spacing.md,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabBtnActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    tabText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    // Chart area
    chartRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chartWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerLabel: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerTotal: {
      fontSize: fontSize.xl,
      fontWeight: '800',
      color: colors.text,
    },
    centerSub: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Legend
    legendWrap: {
      flex: 1,
      marginLeft: spacing.lg,
      gap: spacing.sm + 2,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    legendLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      flex: 1,
    },
    legendValue: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.text,
    },
    legendPercent: {
      fontSize: 11,
      color: colors.textLight,
      marginLeft: 4,
    },

    // Divider & filters
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    filterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 1,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#fff',
    },

    // Skeleton
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    skeletonLegend: {
      flex: 1,
      marginLeft: spacing.lg,
      gap: spacing.sm + 2,
    },
    skeletonLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'space-between',
    },
    skeletonLegendLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
  }), [colors]);
}

// ─── Sub-components ───

function ChartSkeleton({ styles }: { styles: ReturnType<typeof useStyles> }) {
  return (
    <View style={styles.skeletonRow}>
      <Skeleton width={136} height={136} radius={68} />
      <View style={styles.skeletonLegend}>
        {[{ label: 60, value: 28 }, { label: 40, value: 22 }, { label: 50, value: 28 }].map((w, i) => (
          <View key={i} style={styles.skeletonLegendItem}>
            <View style={styles.skeletonLegendLeft}>
              <Skeleton width={10} height={10} radius={5} />
              <Skeleton width={w.label} height={13} />
            </View>
            <Skeleton width={w.value} height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

interface DonutChartProps {
  slices: { label: string; value: number; color: string }[];
  styles: ReturnType<typeof useStyles>;
  colors: any;
}

function DonutChart({ slices, styles, colors }: DonutChartProps) {
  const total = slices.reduce((s, i) => s + i.value, 0);
  const isEmpty = total === 0;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const pieData = isEmpty
    ? [{ value: 1, color: colors.border }]
    : slices.map((s) => ({ value: s.value, color: s.color }));

  return (
    <View style={styles.chartRow}>
      <View style={styles.chartWrap}>
        <PieChart
          data={pieData}
          donut
          radius={68}
          innerRadius={46}
          innerCircleColor={colors.surface}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              {isEmpty ? (
                <Text style={styles.centerSub}>No data</Text>
              ) : (
                <>
                  <Text style={styles.centerTotal}>{total}</Text>
                  <Text style={styles.centerSub}>days</Text>
                </>
              )}
            </View>
          )}
        />
      </View>
      <View style={styles.legendWrap}>
        {slices.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendValue}>{item.value}</Text>
            {!isEmpty && <Text style={styles.legendPercent}>{pct(item.value)}%</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Component ───

export default function AttendanceStatusChart() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();

  const [activeTab, setActiveTab] = useState<ChartTab>('attendance');
  const [filter, setFilter] = useState<Filter>('this_month');

  const [attLoading, setAttLoading] = useState(true);
  const [attStats, setAttStats] = useState({ inTime: 0, late: 0, absent: 0 });

  const [stdLoading, setStdLoading] = useState(true);
  const [stdStats, setStdStats] = useState({ present: 0, absent: 0, leave: 0 });

  const fetchAttendance = useCallback(async () => {
    if (!user?.id) return;
    setAttLoading(true);
    try {
      const { startDate, endDate } = getDateRange(filter);
      const data = await getMyAttendanceReport(user.id, startDate, endDate);
      setAttStats(computeAttStats(Array.isArray(data) ? data : []));
    } catch {
      setAttStats({ inTime: 0, late: 0, absent: 0 });
    } finally {
      setAttLoading(false);
    }
  }, [user?.id, filter]);

  const fetchStandup = useCallback(async () => {
    if (!user?.id) return;
    setStdLoading(true);
    try {
      const params = getStandupParams(filter);
      const { summary } = await getMyStandupLog(params);
      setStdStats({ present: summary.present, absent: summary.absent, leave: summary.leave });
    } catch {
      setStdStats({ present: 0, absent: 0, leave: 0 });
    } finally {
      setStdLoading(false);
    }
  }, [user?.id, filter]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => { fetchStandup(); }, [fetchStandup]);

  const loading = activeTab === 'attendance' ? attLoading : stdLoading;

  const attSlices = [
    { label: 'In-time', value: attStats.inTime, color: ATT_COLORS.inTime },
    { label: 'Late',    value: attStats.late,   color: ATT_COLORS.late   },
    { label: 'Absent',  value: attStats.absent, color: ATT_COLORS.absent },
  ];

  const stdSlices = [
    { label: 'Present', value: stdStats.present, color: STD_COLORS.present },
    { label: 'Leave',   value: stdStats.leave,   color: STD_COLORS.leave   },
    { label: 'Absent',  value: stdStats.absent,  color: STD_COLORS.absent  },
  ];

  return (
    <View style={styles.card}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['attendance', 'standup'] as ChartTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'attendance' ? 'Attendance Status' : 'Standup Status'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart content */}
      {loading ? (
        <ChartSkeleton styles={styles} />
      ) : activeTab === 'attendance' ? (
        <DonutChart slices={attSlices} styles={styles} colors={colors} />
      ) : (
        <DonutChart slices={stdSlices} styles={styles} colors={colors} />
      )}

      {/* Filter chips */}
      <View style={styles.divider} />
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
