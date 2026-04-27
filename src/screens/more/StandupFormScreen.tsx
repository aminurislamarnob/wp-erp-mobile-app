import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { useToast } from '../../components/Toast';
import { getStandupEmployees, saveStandup, StandupEmployee } from '../../api/endpoints';

type Status = 'present' | 'absent' | 'leave';

const STATUS_CYCLE: Status[] = ['present', 'absent', 'leave'];

const STATUS_META: Record<Status, { bg: string; text: string; label: string }> = {
  present: { bg: '#D1FAE5', text: '#065F46', label: 'P' },
  absent:  { bg: '#FEE2E2', text: '#991B1B', label: 'A' },
  leave:   { bg: '#EDE9FE', text: '#5B21B6', label: 'L' },
};

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function displayDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

const AVATAR_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED'];
function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    content: { padding: spacing.md, paddingBottom: 100 },

    // Date row
    dateCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    dateLabel: {
      flex: 1,
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.text,
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary + '14',
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: 10,
    },
    dateBadgeText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
    },

    // Bulk actions
    bulkRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    bulkBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      alignItems: 'center',
    },
    bulkBtnText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    // Employee list
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    empRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing.sm,
    },
    empRowLast: {
      borderBottomWidth: 0,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#fff',
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    empName: {
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },
    statusChips: {
      flexDirection: 'row',
      gap: 4,
    },
    chip: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipText: {
      fontSize: 11,
      fontWeight: '800',
    },

    // Empty
    emptyBox: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      textAlign: 'center',
    },

    // Footer
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.md,
      paddingBottom: spacing.md + spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    saveBtnText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '700',
    },
  }), [colors]);
}

export default function StandupFormScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const toast = useToast();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(today);
  const [showPicker, setShowPicker] = useState(false);
  const [employees, setEmployees] = useState<StandupEmployee[]>([]);
  const [statuses, setStatuses] = useState<Record<number, Status>>({});
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEmployees = useCallback(async (date: Date) => {
    setLoadingEmployees(true);
    try {
      const list = await getStandupEmployees(formatDateStr(date));
      setEmployees(list);
      const initial: Record<number, Status> = {};
      list.forEach((emp) => {
        initial[emp.employee_id] = (emp.standup_status as Status) ?? 'present';
      });
      setStatuses(initial);
    } catch (e: any) {
      setEmployees([]);
      setStatuses({});
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not load employees.';
      toast.error('Failed to load employees', msg);
    } finally {
      setLoadingEmployees(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEmployees(selectedDate);
  }, []);

  function onDateChange(_: DateTimePickerEvent, date?: Date) {
    setShowPicker(Platform.OS === 'ios');
    if (date) {
      date.setHours(0, 0, 0, 0);
      setSelectedDate(date);
      loadEmployees(date);
    }
  }

  function markAll(status: Status) {
    const next: Record<number, Status> = {};
    employees.forEach((emp) => { next[emp.employee_id] = status; });
    setStatuses(next);
  }

  async function handleSave() {
    if (employees.length === 0) return;
    setSaving(true);
    try {
      const records = employees.map((emp) => ({
        employee_id: emp.employee_id,
        status: statuses[emp.employee_id] ?? 'present',
      }));
      await saveStandup(formatDateStr(selectedDate), records);
      toast.success('Standup saved', `Records saved for ${displayDate(selectedDate)}`);
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Could not save standup records.';
      toast.error('Save failed', msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Record Standup" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Date selector */}
        <TouchableOpacity style={styles.dateCard} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Feather name="calendar" size={18} color={colors.textSecondary} />
          <Text style={styles.dateLabel}>Date</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{displayDate(selectedDate)}</Text>
            <Feather name="chevron-down" size={14} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={today}
            onChange={onDateChange}
          />
        )}

        {/* Bulk actions */}
        {employees.length > 0 && (
          <View style={styles.bulkRow}>
            {(STATUS_CYCLE as Status[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.bulkBtn, { backgroundColor: STATUS_META[s].bg }]}
                onPress={() => markAll(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.bulkBtnText, { color: STATUS_META[s].text }]}>
                  All {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Employee list */}
        <View style={styles.listCard}>
          {loadingEmployees ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.emptyText}>Loading employees…</Text>
            </View>
          ) : employees.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="users" size={36} color={colors.textLight} />
              <Text style={styles.emptyText}>No employees with a shift on this date</Text>
            </View>
          ) : (
            employees.map((emp, i) => {
              const status = statuses[emp.employee_id] ?? 'present';
              return (
                <View
                  key={emp.employee_id}
                  style={[styles.empRow, i === employees.length - 1 && styles.empRowLast]}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor(emp.employee_id) }]}>
                    <Text style={styles.avatarText}>{getInitial(emp.name)}</Text>
                  </View>
                  <Text style={styles.empName} numberOfLines={1}>{emp.name}</Text>
                  <View style={styles.statusChips}>
                    {(STATUS_CYCLE as Status[]).map((s) => {
                      const active = status === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: active ? STATUS_META[s].bg : colors.border + '60',
                            },
                          ]}
                          onPress={() => setStatuses((prev) => ({ ...prev, [emp.employee_id]: s }))}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: active ? STATUS_META[s].text : colors.textLight },
                            ]}
                          >
                            {STATUS_META[s].label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Save footer */}
      {employees.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="save" size={18} color="#fff" />
            )}
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Standup'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
