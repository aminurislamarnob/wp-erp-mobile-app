import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/Toast';
import {
  getMyLeaveRequests,
  getMyPendingLeaves,
  getMyRejectedLeaves,
  getMyLeaveBalance,
  getHolidays,
} from '../../api/endpoints';
import { LeaveRequest, Holiday } from '../../types';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';

type TabKey = 'requests' | 'balance' | 'holidays';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_FILTERS: { key: StatusFilter; label: string; value?: number }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending', value: 2 },
  { key: 'approved', label: 'Approved', value: 1 },
  { key: 'rejected', label: 'Rejected', value: 3 },
];

function SkeletonRequestCard() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Skeleton width={10} height={10} radius={5} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Skeleton width="65%" height={16} />
          </View>
        </View>
        <Skeleton width={68} height={24} radius={8} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.dateRow}>
          <Skeleton width={14} height={14} radius={7} />
          <Skeleton width="50%" height={14} />
          <Skeleton width={28} height={18} radius={6} />
        </View>
        <Skeleton width="85%" height={14} style={{ marginTop: spacing.xs }} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={72} height={12} />
        <Skeleton width={16} height={16} radius={8} style={{ marginLeft: 4 }} />
      </View>
    </View>
  );
}

function SkeletonBalanceCard() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.balanceHeader}>
        <Skeleton width={10} height={10} radius={5} />
        <Skeleton width={120} height={16} style={{ marginLeft: spacing.sm }} />
      </View>
      <View style={{ marginBottom: spacing.md }}>
        <Skeleton width="100%" height={6} radius={3} />
      </View>
      <View style={styles.balanceRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.balanceStat}>
            <Skeleton width={30} height={20} />
            <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SkeletonHolidayCard() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.holidayRow}>
        <Skeleton width={40} height={40} radius={20} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Skeleton width="60%" height={16} />
          <View style={[styles.dateRow, { marginTop: 6 }]}>
            <Skeleton width={12} height={12} radius={6} />
            <Skeleton width={100} height={13} />
          </View>
        </View>
      </View>
    </View>
  );
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

    // Tabs
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },

    // Filter chips
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: 16,
      backgroundColor: colors.background,
      marginRight: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    chipTextActive: {
      color: '#fff',
    },

    // List
    list: {
      padding: spacing.md,
      paddingBottom: 80,
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    cardPast: {
      opacity: 0.5,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    policyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    policyName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    cardBody: {
      marginBottom: spacing.sm,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: '500',
    },
    daysBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 6,
    },
    daysText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.primary,
    },
    reason: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    viewDetail: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginRight: 4,
    },

    // Balance
    balanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    balancePolicyName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: colors.background,
      borderRadius: 3,
      marginBottom: spacing.md,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: 6,
      borderRadius: 3,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    balanceStat: {
      alignItems: 'center',
    },
    balanceValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.text,
    },
    balanceLabel: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Holiday
    holidayRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    holidayIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    holidayIconUpcoming: {
      backgroundColor: colors.warning + '15',
    },
    holidayInfo: {
      flex: 1,
    },
    holidayName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    holidayDate: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    holidayDesc: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: 4,
    },
    textPast: {
      color: colors.textLight,
    },

    // Empty
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 3,
      gap: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.md,
      color: colors.textLight,
    },

    // FAB
    fab: {
      position: 'absolute',
      bottom: spacing.lg,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  }), [colors]);
}

export default function LeaveScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();

  const STATUS_MAP: Record<number, { label: string; color: string }> = {
    1: { label: 'Approved', color: colors.success },
    2: { label: 'Pending', color: colors.warning },
    3: { label: 'Rejected', color: colors.error },
  };

  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    try {
      let result;
      if (statusFilter === 'pending') {
        result = await getMyPendingLeaves(user.id);
      } else if (statusFilter === 'rejected') {
        result = await getMyRejectedLeaves(user.id);
      } else {
        const all = await getMyLeaveRequests(user.id);
        const filter = STATUS_FILTERS.find((f) => f.key === statusFilter);
        const filterValue = filter?.value;
        result = filterValue !== undefined ? all.filter((r) => r.status === filterValue) : all;
      }
      setRequests(result);
    } catch (err: any) {
      toast.error('Load Failed', err?.message || 'Failed to load leave requests');
    }
  }, [user, statusFilter]);

  const loadBalances = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyLeaveBalance(user.id);
      setBalances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setBalances([]);
      toast.error('Load Failed', err?.message || 'Failed to load leave balance');
    }
  }, [user]);

  const loadHolidays = useCallback(async () => {
    try {
      const data = await getHolidays();
      // Sort upcoming first
      const today = new Date().toISOString().split('T')[0];
      const sorted = data.sort((a, b) => {
        const aUpcoming = a.start_date >= today ? 0 : 1;
        const bUpcoming = b.start_date >= today ? 0 : 1;
        if (aUpcoming !== bUpcoming) return aUpcoming - bUpcoming;
        return a.start_date.localeCompare(b.start_date);
      });
      setHolidays(sorted);
    } catch {
      setHolidays([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'requests') await loadRequests();
    else if (activeTab === 'balance') await loadBalances();
    else if (activeTab === 'holidays') await loadHolidays();
    setLoading(false);
  }, [activeTab, loadRequests, loadBalances, loadHolidays]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Leave" />
      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['requests', 'balance', 'holidays'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Feather
              name={tab === 'requests' ? 'file-text' : tab === 'balance' ? 'pie-chart' : 'sun'}
              size={16}
              color={activeTab === tab ? colors.primary : colors.textLight}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'requests' ? 'Requests' : tab === 'balance' ? 'Balance' : 'Holidays'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status filter chips (requests tab only) */}
      {activeTab === 'requests' && (
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, statusFilter === f.key && styles.chipActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.list}>
          {activeTab === 'requests'
            ? [1, 2, 3, 4, 5].map((i) => <SkeletonRequestCard key={i} />)
            : activeTab === 'balance'
            ? [1, 2, 3, 4, 5].map((i) => <SkeletonBalanceCard key={i} />)
            : [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonHolidayCard key={i} />)}
        </ScrollView>
      ) : activeTab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              statusMap={STATUS_MAP}
              onPress={() => navigation.navigate('LeaveDetail', { requestId: item.id, source: statusFilter })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="inbox" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No leave requests</Text>
            </View>
          }
        />
      ) : activeTab === 'balance' ? (
        <FlatList
          data={balances}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <BalanceCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="pie-chart" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No leave balance data</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={holidays}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <HolidayCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="sun" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No holidays found</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NewLeaveRequest')}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
    </View>
  );
}

// ─── Request Card ───

function RequestCard({ item, statusMap, onPress }: { item: LeaveRequest; statusMap: Record<number, { label: string; color: string }>; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const status = statusMap[Number(item.status)] || statusMap[2];
  const startDate = formatDate(item.start_date);
  const endDate = formatDate(item.end_date);
  const days = getDayCount(item.start_date, item.end_date);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.policyDot, { backgroundColor: item.policy?.color || colors.primary }]} />
          <Text style={styles.policyName}>{item.policy?.name || 'Leave Request'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.dateRow}>
          <Feather name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>{startDate} — {endDate}</Text>
          <View style={styles.daysBadge}>
            <Text style={styles.daysText}>{days}d</Text>
          </View>
        </View>
        {item.reason ? (
          <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetail}>View details</Text>
        <Feather name="chevron-right" size={16} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Balance Card ───

function BalanceCard({ item }: { item: any }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const policyName = item.policy || item.policy_name || 'Leave Policy';
  const total = Number(item.entitlement || item.total || 0);
  const used = Number(item.spent || 0);
  const remaining = Number(item.available ?? (total - used));
  const progress = total > 0 ? used / total : 0;
  const policyColor = item.color || colors.primary;

  return (
    <View style={styles.card}>
      <View style={styles.balanceHeader}>
        <View style={[styles.policyDot, { backgroundColor: policyColor }]} />
        <Text style={styles.balancePolicyName}>{policyName}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: policyColor },
          ]}
        />
      </View>

      <View style={styles.balanceRow}>
        <View style={styles.balanceStat}>
          <Text style={styles.balanceValue}>{total}</Text>
          <Text style={styles.balanceLabel}>Entitled</Text>
        </View>
        <View style={styles.balanceStat}>
          <Text style={[styles.balanceValue, { color: colors.error }]}>{used}</Text>
          <Text style={styles.balanceLabel}>Used</Text>
        </View>
        <View style={styles.balanceStat}>
          <Text style={[styles.balanceValue, { color: colors.success }]}>{remaining}</Text>
          <Text style={styles.balanceLabel}>Remaining</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Holiday Card ───

function HolidayCard({ item }: { item: Holiday }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const today = new Date().toISOString().split('T')[0];
  const isPast = item.end_date < today;
  const isUpcoming = item.start_date > today;
  const startDate = formatDate(item.start_date);
  const endDate = item.end_date !== item.start_date ? formatDate(item.end_date) : null;
  const days = getDayCount(item.start_date, item.end_date);

  return (
    <View style={[styles.card, isPast && styles.cardPast]}>
      <View style={styles.holidayRow}>
        <View style={[styles.holidayIcon, isUpcoming && styles.holidayIconUpcoming]}>
          <Feather name="sun" size={18} color={isUpcoming ? colors.warning : colors.textLight} />
        </View>
        <View style={styles.holidayInfo}>
          <Text style={[styles.holidayName, isPast && styles.textPast]}>{item.name}</Text>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={12} color={colors.textSecondary} />
            <Text style={styles.holidayDate}>
              {startDate}{endDate ? ` — ${endDate}` : ''}
            </Text>
            {days > 1 && (
              <View style={styles.daysBadge}>
                <Text style={styles.daysText}>{days}d</Text>
              </View>
            )}
          </View>
          {item.description ? (
            <Text style={styles.holidayDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ───

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDayCount(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}
