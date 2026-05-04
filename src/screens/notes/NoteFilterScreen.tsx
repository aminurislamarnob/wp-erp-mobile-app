import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppHeader from '../../components/AppHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import { Label } from '../../types';

export default function NoteFilterScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = useStyles();

  const labels: Label[] = route.params?.labels ?? [];
  const initial = route.params?.initial ?? {};

  const [selectedIds, setSelectedIds] = useState<number[]>(initial.label_ids || []);
  const [dateFrom, setDateFrom] = useState<string | undefined>(initial.date_from);
  const [dateTo, setDateTo] = useState<string | undefined>(initial.date_to);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function fmt(date: string | undefined): string {
    if (!date) return 'Select date';
    return date;
  }

  function clearAll() {
    setSelectedIds([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  }

  function apply() {
    navigation.navigate({
      name: 'NotesList',
      params: { appliedFilters: { label_ids: selectedIds, date_from: dateFrom, date_to: dateTo } },
      merge: true,
    });
  }

  function handleDate(setter: (s?: string) => void, hide: () => void) {
    return (_: any, d?: Date) => {
      hide();
      if (!d) return;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setter(`${yyyy}-${mm}-${dd}`);
    };
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Filter Notes" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Labels */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Labels (match all)</Text>
          {labels.length === 0 ? (
            <Text style={styles.empty}>No labels yet</Text>
          ) : (
            <View style={styles.chipsRow}>
              {labels.map((l) => {
                const active = selectedIds.includes(l.id);
                return (
                  <TouchableOpacity
                    key={l.id}
                    style={[
                      styles.chip,
                      { borderColor: l.color, backgroundColor: active ? l.color + '33' : 'transparent' },
                    ]}
                    onPress={() => toggle(l.id)}
                  >
                    <View style={[styles.dot, { backgroundColor: l.color }]} />
                    <Text style={[styles.chipText, { color: active ? l.color : colors.textSecondary }]}>
                      {l.name}
                    </Text>
                    {active && <Feather name="check" size={12} color={l.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Date range */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Date range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
              <Feather name="calendar" size={14} color={colors.textSecondary} />
              <Text style={styles.dateText}>From: {fmt(dateFrom)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
              <Feather name="calendar" size={14} color={colors.textSecondary} />
              <Text style={styles.dateText}>To: {fmt(dateTo)}</Text>
            </TouchableOpacity>
          </View>
          {(dateFrom || dateTo) && (
            <TouchableOpacity onPress={() => { setDateFrom(undefined); setDateTo(undefined); }}>
              <Text style={styles.linkText}>Clear dates</Text>
            </TouchableOpacity>
          )}
        </View>

        {showFromPicker && (
          <DateTimePicker
            value={dateFrom ? new Date(dateFrom) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDate(setDateFrom, () => setShowFromPicker(false))}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={dateTo ? new Date(dateTo) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDate(setDateTo, () => setShowToPicker(false))}
          />
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={clearAll}>
            <Text style={styles.btnSecondaryText}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={apply}>
            <Text style={styles.btnPrimaryText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      gap: 6,
    },
    chipText: { fontSize: fontSize.xs, fontWeight: '600' },
    dot: { width: 8, height: 8, borderRadius: 4 },

    dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    dateBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: 10,
      backgroundColor: colors.background,
    },
    dateText: { fontSize: fontSize.sm, color: colors.text },
    linkText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '600',
    },
    empty: { fontSize: fontSize.sm, color: colors.textLight, paddingVertical: spacing.sm },

    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    btnSecondary: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    btnSecondaryText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
    btnPrimary: {
      flex: 2,
      paddingVertical: spacing.sm + 4,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    btnPrimaryText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },
  }), [colors]);
}
