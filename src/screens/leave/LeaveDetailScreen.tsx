import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLeaveRequestDetail, getPendingLeaveDetail, getRejectedLeaveDetail } from '../../api/endpoints';
import { LeaveRequest } from '../../types';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import ClockFAB from '../../components/ClockFAB';

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl * 2,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },

    // Status banner
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: 16,
      marginBottom: spacing.md,
    },
    statusLabel: {
      fontSize: fontSize.xl,
      fontWeight: '700',
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    policyDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.sm,
    },
    policyName: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.text,
    },

    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.md,
    },

    // Dates
    dateBlock: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dateInfo: {},
    dateLabel: {
      fontSize: fontSize.xs,
      color: colors.textLight,
    },
    dateValue: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginTop: 2,
    },
    dateDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
    daysSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    daysText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
    },

    // Reason
    reasonText: {
      fontSize: fontSize.sm,
      color: colors.text,
      lineHeight: 22,
    },

    // Comments
    commentBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: 10,
    },
    commentText: {
      fontSize: fontSize.sm,
      color: colors.text,
      flex: 1,
      lineHeight: 22,
    },

    // Timeline
    timelineStep: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      minHeight: 48,
    },
    timelineLeft: {
      alignItems: 'center',
      width: 32,
      marginRight: spacing.md,
    },
    timelineDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginVertical: 4,
      minHeight: 16,
    },
    timelineLabel: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      paddingTop: 4,
    },
  }), [colors]);
}

export default function LeaveDetailScreen() {
  const route = useRoute<any>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const { requestId, source } = route.params;

  const STATUS_MAP: Record<number, { label: string; color: string; icon: keyof typeof Feather.glyphMap }> = {
    1: { label: 'Approved', color: colors.success, icon: 'check-circle' },
    2: { label: 'Pending', color: colors.warning, icon: 'clock' },
    3: { label: 'Rejected', color: colors.error, icon: 'x-circle' },
  };

  const [request, setRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        let data: LeaveRequest | null = null;
        if (source === 'pending') {
          data = await getPendingLeaveDetail(user.id, requestId);
        } else if (source === 'rejected') {
          data = await getRejectedLeaveDetail(user.id, requestId);
        } else {
          data = await getLeaveRequestDetail(requestId, user.id);
        }
        setRequest(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId, source, user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <AppHeader showBack />
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>Could not load request details</Text>
        </View>
      </View>
    );
  }

  const statusNum = Number(request.status);
  const status = STATUS_MAP[statusNum] || STATUS_MAP[2];
  const days = getDayCount(request.start_date, request.end_date);

  return (
    <View style={styles.container}>
    <AppHeader showBack />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: status.color + '15' }]}>
        <Feather name={status.icon} size={28} color={status.color} />
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
      </View>

      {/* Policy */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={[styles.policyDot, { backgroundColor: request.policy?.color || colors.primary }]} />
          <Text style={styles.policyName}>{request.policy?.name || 'Leave Request'}</Text>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Duration</Text>
        <View style={styles.dateBlock}>
          <View style={styles.dateItem}>
            <Feather name="log-in" size={16} color={colors.primary} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatDate(request.start_date)}</Text>
            </View>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateItem}>
            <Feather name="log-out" size={16} color={colors.primary} />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatDate(request.end_date)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.daysSummary}>
          <Feather name="calendar" size={14} color={colors.primary} />
          <Text style={styles.daysText}>
            {days} day{days !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Reason */}
      {request.reason ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Reason</Text>
          <Text style={styles.reasonText}>{request.reason}</Text>
        </View>
      ) : null}

      {/* Admin Comments */}
      {request.comments ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Admin Comments</Text>
          <View style={styles.commentBox}>
            <Feather name="message-circle" size={14} color={colors.textSecondary} />
            <Text style={styles.commentText}>{request.comments}</Text>
          </View>
        </View>
      ) : null}

      {/* Intermediate Approver */}
      {request.required_approval ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Approval Required</Text>
          <View style={styles.commentBox}>
            <Feather name="user-check" size={14} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.commentText}>{request.required_approval.approver_name}</Text>
              <Text style={[styles.commentText, {
                fontSize: fontSize.xs,
                color: request.required_approval.status === 'Approved'
                  ? colors.success
                  : request.required_approval.status === 'Rejected'
                  ? colors.error
                  : colors.warning,
                marginTop: 2,
              }]}>
                {request.required_approval.status}
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Status Message */}
      {request.message ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Status Note</Text>
          <View style={styles.commentBox}>
            <Feather name="info" size={14} color={colors.textSecondary} />
            <Text style={styles.commentText}>{request.message}</Text>
          </View>
        </View>
      ) : null}

      {/* Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Status Timeline</Text>
        <TimelineStep
          icon="send"
          label="Submitted"
          active
          color={colors.primary}
          isLast={false}
        />
        <TimelineStep
          icon="clock"
          label="Pending Review"
          active={statusNum >= 1}
          color={colors.warning}
          isLast={statusNum === 2}
        />
        {statusNum === 1 && (
          <TimelineStep
            icon="check-circle"
            label="Approved"
            active
            color={colors.success}
            isLast
          />
        )}
        {statusNum === 3 && (
          <TimelineStep
            icon="x-circle"
            label="Rejected"
            active
            color={colors.error}
            isLast
          />
        )}
      </View>
    </ScrollView>
    <ClockFAB />
    </View>
  );
}

// ─── Timeline Step ───

function TimelineStep({
  icon,
  label,
  active,
  color,
  isLast,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active: boolean;
  color: string;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: active ? color : colors.border }]}>
          <Feather name={icon} size={14} color={active ? '#fff' : colors.textLight} />
        </View>
        {!isLast && (
          <View style={[styles.timelineLine, { backgroundColor: active ? color + '40' : colors.border }]} />
        )}
      </View>
      <Text style={[styles.timelineLabel, active && { color: colors.text, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Helpers ───

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getDayCount(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}
