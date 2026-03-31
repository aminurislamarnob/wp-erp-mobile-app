import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getMyLeaveRequests } from '../../api/endpoints';
import { LeaveRequest } from '../../types';
import { colors, spacing, fontSize } from '../../constants/theme';

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending', color: colors.warning },
  1: { label: 'Approved', color: colors.success },
  2: { label: 'Pending', color: colors.warning },
  3: { label: 'Rejected', color: colors.error },
};

export default function LeaveScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getMyLeaveRequests(user.id);
      setRequests(result.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: LeaveRequest }) {
    const status = STATUS_MAP[item.status] || STATUS_MAP[0];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.policyName}>
            {item.policy?.name || 'Leave Request'}
          </Text>
          <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{item.start_date}</Text>
          <Text style={styles.dateSeparator}>to</Text>
          <Text style={styles.dateText}>{item.end_date}</Text>
        </View>
        {item.reason ? (
          <Text style={styles.reason} numberOfLines={2}>
            {item.reason}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No leave requests yet</Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  policyName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  dateSeparator: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginHorizontal: spacing.sm,
  },
  reason: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
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
  fabText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: '300',
    marginTop: -2,
  },
});
