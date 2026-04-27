import React, { useState, useCallback } from 'react';
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
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { getPaymentRequests, PaymentRequest } from '../../api/endpoints';

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
  return currency ? `${currency} ${num}` : num;
}

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  approved: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
};

function formatDate(str: string | null): string {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    cardTitle: {
      flex: 1,
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
      marginRight: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 20,
    },
    statusText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.xs,
    },
    amount: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.primary,
    },
    metaRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },

    emptyBox: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 3,
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
      backgroundColor: colors.primary,
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

function SkeletonList() {
  const styles = useStyles();
  return (
    <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Skeleton width="55%" height={16} radius={6} />
            <Skeleton width={64} height={22} radius={11} />
          </View>
          <Skeleton width={80} height={22} radius={6} style={{ marginBottom: 10 }} />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Skeleton width={90} height={12} radius={6} />
            <Skeleton width={90} height={12} radius={6} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export default function ReimbursementScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const toast = useToast();

  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getPaymentRequests();
      setCurrency(res.currency);
      setRequests(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not load requests';
      toast.error('Failed to load', msg);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Payment Request" />

      {loading ? (
        <SkeletonList />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
          }
        >
          {requests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="inbox" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>No payment requests yet</Text>
            </View>
          ) : (
            requests.map((req) => {
              const meta = STATUS_META[req.status] ?? STATUS_META.pending;
              return (
                <TouchableOpacity
                  key={req.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('MorePaymentRequestDetail', { id: req.id, currency })}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{req.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
                    </View>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amount}>{formatAmount(req.amount, currency)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="calendar" size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{formatDate(req.purchase_date)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="paperclip" size={12} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{req.attachments?.length ?? 0} file{(req.attachments?.length ?? 0) !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('MorePaymentRequestNew')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
