import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import { getPaymentRequest, PaymentRequest } from '../../api/endpoints';

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  approved: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
};

function formatDate(str: string | null): string {
  if (!str || str.startsWith('0000') || str.startsWith('0001') || str.startsWith('0002')) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime()) || d.getFullYear() < 1900) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateTime(str: string | null): string {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fileIcon(type: string): 'file-text' | 'image' | 'file' {
  if (type === 'pdf') return 'file-text';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return 'image';
  return 'file';
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

    // Status banner
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
    },
    statusTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
    },
    statusBadge: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: 20,
    },
    statusBadgeText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
    },

    // Amount card
    amountCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    amountLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.primary,
    },

    // Info card
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoIcon: {
      marginRight: spacing.sm,
      marginTop: 2,
    },
    infoContent: { flex: 1 },
    infoLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 3,
    },
    infoValue: {
      fontSize: fontSize.sm,
      color: colors.text,
      fontWeight: '500',
      lineHeight: 20,
    },

    // Note card (rejection / hr note)
    noteCard: {
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.md,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    noteText: {
      flex: 1,
      fontSize: fontSize.sm,
      lineHeight: 20,
      fontWeight: '500',
    },

    // Section header
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },

    // Attachments
    attachCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    attachRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    attachRowLast: {
      borderBottomWidth: 0,
    },
    attachName: {
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },

    // Skeleton
    skeletonCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
  }), [colors]);
}

function SkeletonDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
      <Skeleton width="100%" height={60} radius={14} style={{ marginBottom: spacing.md }} />
      <Skeleton width="100%" height={80} radius={14} style={{ marginBottom: spacing.md }} />
      <View style={styles.skeletonCard}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ gap: 6, paddingVertical: 6 }}>
            <Skeleton width={80} height={11} radius={5} />
            <Skeleton width="70%" height={14} radius={5} />
          </View>
        ))}
      </View>
      <View style={styles.skeletonCard}>
        <Skeleton width={100} height={12} radius={5} />
        {[1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
            <Skeleton width={20} height={20} radius={4} />
            <Skeleton width="60%" height={14} radius={5} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function PaymentRequestDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const route = useRoute<any>();
  const { id, currency = '' } = route.params as { id: number; currency?: string };

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getPaymentRequest(id)
        .then(setRequest)
        .catch(() => setRequest(null))
        .finally(() => setLoading(false));
    }, [id])
  );

  const meta = request ? (STATUS_META[request.status] ?? STATUS_META.pending) : STATUS_META.pending;

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Payment Request" />

      {loading ? (
        <SkeletonDetail />
      ) : !request ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="alert-circle" size={40} color={colors.textLight} />
          <Text style={{ color: colors.textLight, marginTop: spacing.sm }}>Could not load request</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>

          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusTitle, { color: meta.text }]} numberOfLines={2}>
              {request.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: meta.text + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: meta.text }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>
              {currency ? `${currency} ` : ''}{parseFloat(request.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* HR note (rejection) */}
          {request.status === 'rejected' && request.hr_note && (
            <View style={[styles.noteCard, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="alert-circle" size={16} color="#991B1B" style={{ marginTop: 2 }} />
              <Text style={[styles.noteText, { color: '#991B1B' }]}>{request.hr_note}</Text>
            </View>
          )}

          {/* Approval info */}
          {request.status === 'approved' && request.payment_type && (
            <View style={[styles.noteCard, { backgroundColor: '#D1FAE5' }]}>
              <Feather name="check-circle" size={16} color="#065F46" style={{ marginTop: 2 }} />
              <Text style={[styles.noteText, { color: '#065F46' }]}>
                Approved · Payment via {request.payment_type.replace('_', ' ')}
              </Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="align-left" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{request.description}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Purchase Date</Text>
                <Text style={styles.infoValue}>{formatDate(request.purchase_date)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Feather name="clock" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Expected Payment By</Text>
                <Text style={styles.infoValue}>{formatDate(request.expect_payment_by)}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Feather name="edit-3" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Submitted</Text>
                <Text style={styles.infoValue}>{formatDateTime(request.created_at)}</Text>
              </View>
            </View>
          </View>

          {/* Attachments */}
          {request.attachments?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Attachments</Text>
              <View style={styles.attachCard}>
                {request.attachments.map((att, i) => (
                  <TouchableOpacity
                    key={att.id}
                    style={[styles.attachRow, i === request.attachments.length - 1 && styles.attachRowLast]}
                    onPress={() => Linking.openURL(att.url)}
                    activeOpacity={0.7}
                  >
                    <Feather name={fileIcon(att.type)} size={18} color={colors.primary} />
                    <Text style={styles.attachName} numberOfLines={1}>{att.filename}</Text>
                    <Feather name="external-link" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

        </ScrollView>
      )}
    </View>
  );
}
