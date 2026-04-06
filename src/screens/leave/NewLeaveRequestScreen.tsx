import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useToast } from '../../components/Toast';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getMyLeaveBalance, submitLeaveRequest } from '../../api/endpoints';
import { LeavePolicy } from '../../types';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

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
    },

    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },

    // Selector
    selector: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedPolicyRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    policyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    selectorText: {
      fontSize: fontSize.sm,
      color: colors.text,
    },
    selectorPlaceholder: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },
    dateDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    // Policy picker list
    pickerList: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    pickerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    pickerItemActive: {
      backgroundColor: colors.primary + '10',
    },
    pickerItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pickerItemText: {
      fontSize: fontSize.sm,
      color: colors.text,
    },
    pickerItemBal: {
      fontSize: fontSize.xs,
      color: colors.success,
      fontWeight: '600',
    },
    noDataText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },

    // Balance preview
    balancePreview: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
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

    // Duration
    durationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
    },
    durationText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '600',
    },

    // Text area
    textArea: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      fontSize: fontSize.sm,
      color: colors.text,
      minHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // File picker
    filePickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    filePickerText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '500',
    },
    fileList: {
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: fontSize.sm,
      color: colors.text,
    },
    fileSize: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: 1,
    },

    // Submit
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: spacing.sm + 6,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    submitBtnDisabled: {
      opacity: 0.6,
    },
    submitBtnText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
  }), [colors]);
}

export default function NewLeaveRequestScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
  const [showPolicyPicker, setShowPolicyPicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const balanceData = await getMyLeaveBalance(user.id);
      const items = Array.isArray(balanceData) ? balanceData : [];
      setBalances(items);
      const pols: LeavePolicy[] = items.map((b: any) => ({
        id: Number(b.entitlement_id || b.policy_id || b.id),
        name: b.policy || b.name || '',
        description: b.description || '',
        color: b.color || '',
      }));
      setPolicies(pols);
    } catch {
      toast.error('Error', 'Failed to load leave policies');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getBalanceForPolicy(policyId: number) {
    const bal = balances.find(
      (b) => Number(b.leave_id) === policyId || Number(b.policy_id) === policyId || b.id === policyId
    );
    if (!bal) return null;
    const total = Number(bal.entitlement || bal.total || 0);
    const used = Number(bal.spent || 0);
    return { total, used, remaining: Number(bal.available ?? (total - used)) };
  }

  function formatDateDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function toAPIDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getDayCount(): number {
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.round(diff / 86400000) + 1);
  }

  function onStartDateChange(_: DateTimePickerEvent, date?: Date) {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
    }
  }

  function onEndDateChange(_: DateTimePickerEvent, date?: Date) {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      if (date < startDate) {
        toast.warning('Invalid Date', 'End date cannot be before start date');
        return;
      }
      setEndDate(date);
    }
  }

  async function handlePickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const newFiles: AttachedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    } catch {
      toast.error('Error', 'Failed to pick document');
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  async function handleSubmit() {
    if (!user) return;
    if (!selectedPolicy) {
      toast.warning('Required', 'Please select a leave policy');
      return;
    }
    if (!reason.trim()) {
      toast.warning('Required', 'Please enter a reason');
      return;
    }

    const balance = getBalanceForPolicy(selectedPolicy.id);
    if (balance && getDayCount() > balance.remaining) {
      Alert.alert(
        'Insufficient Balance',
        `You have ${balance.remaining} day(s) remaining but requesting ${getDayCount()} day(s).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: doSubmit },
        ]
      );
      return;
    }

    doSubmit();
  }

  async function doSubmit() {
    if (!user || !selectedPolicy) return;
    setSubmitting(true);
    try {
      await submitLeaveRequest({
        user_id: user.id,
        policy_id: selectedPolicy.id,
        start_date: toAPIDate(startDate),
        end_date: toAPIDate(endDate),
        reason: reason.trim(),
        files: files.length > 0 ? files : undefined,
      });
      toast.success('Leave Submitted', 'Your leave request has been submitted successfully', () => navigation.goBack());
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit request';
      toast.error('Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedBalance = selectedPolicy ? getBalanceForPolicy(selectedPolicy.id) : null;

  return (
    <View style={styles.container}>
    <AppHeader />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      {/* Policy Selector */}
      <Text style={styles.label}>Leave Policy</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowPolicyPicker(!showPolicyPicker)}
      >
        {selectedPolicy ? (
          <View style={styles.selectedPolicyRow}>
            <View style={[styles.policyDot, { backgroundColor: selectedPolicy.color || colors.primary }]} />
            <Text style={styles.selectorText}>{selectedPolicy.name}</Text>
          </View>
        ) : (
          <Text style={styles.selectorPlaceholder}>Select leave policy</Text>
        )}
        <Feather name={showPolicyPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textLight} />
      </TouchableOpacity>

      {showPolicyPicker && (
        <View style={styles.pickerList}>
          {policies.map((p) => {
            const bal = getBalanceForPolicy(p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.pickerItem, selectedPolicy?.id === p.id && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedPolicy(p);
                  setShowPolicyPicker(false);
                }}
              >
                <View style={styles.pickerItemLeft}>
                  <View style={[styles.policyDot, { backgroundColor: p.color || colors.primary }]} />
                  <Text style={styles.pickerItemText}>{p.name}</Text>
                </View>
                {bal && (
                  <Text style={styles.pickerItemBal}>{bal.remaining} left</Text>
                )}
              </TouchableOpacity>
            );
          })}
          {policies.length === 0 && (
            <Text style={styles.noDataText}>No leave policies available</Text>
          )}
        </View>
      )}

      {/* Balance Preview */}
      {selectedBalance && (
        <View style={styles.balancePreview}>
          <View style={styles.balanceStat}>
            <Text style={styles.balanceValue}>{selectedBalance.total}</Text>
            <Text style={styles.balanceLabel}>Entitled</Text>
          </View>
          <View style={styles.balanceStat}>
            <Text style={[styles.balanceValue, { color: colors.error }]}>{selectedBalance.used}</Text>
            <Text style={styles.balanceLabel}>Used</Text>
          </View>
          <View style={styles.balanceStat}>
            <Text style={[styles.balanceValue, { color: colors.success }]}>{selectedBalance.remaining}</Text>
            <Text style={styles.balanceLabel}>Available</Text>
          </View>
        </View>
      )}

      {/* Date Range */}
      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowStartPicker(true)}
      >
        <View style={styles.dateDisplay}>
          <Feather name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.selectorText}>{formatDateDisplay(startDate)}</Text>
        </View>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={onStartDateChange}
        />
      )}

      <Text style={styles.label}>End Date</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowEndPicker(true)}
      >
        <View style={styles.dateDisplay}>
          <Feather name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.selectorText}>{formatDateDisplay(endDate)}</Text>
        </View>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={startDate}
          onChange={onEndDateChange}
        />
      )}

      {/* Duration summary */}
      <View style={styles.durationRow}>
        <Feather name="clock" size={14} color={colors.primary} />
        <Text style={styles.durationText}>
          {getDayCount()} day{getDayCount() !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Reason */}
      <Text style={styles.label}>Reason</Text>
      <TextInput
        style={styles.textArea}
        value={reason}
        onChangeText={setReason}
        placeholder="Enter reason for leave..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* File Attachments */}
      <Text style={styles.label}>Attachments (optional)</Text>
      <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickDocument}>
        <Feather name="paperclip" size={18} color={colors.primary} />
        <Text style={styles.filePickerText}>Attach files</Text>
      </TouchableOpacity>

      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file, index) => (
            <View key={`${file.name}-${index}`} style={styles.fileItem}>
              <Feather
                name={file.type.startsWith('image/') ? 'image' : 'file-text'}
                size={16}
                color={colors.textSecondary}
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                {file.size ? (
                  <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => removeFile(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>Submit Request</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}
