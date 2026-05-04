import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import { listLabels, createLabel, updateLabel, deleteLabel } from '../../api/notes';
import { Label } from '../../types';
import { isHexColor, PRESET_LABEL_COLORS } from './utils';

export default function LabelManagerScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useStyles();

  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Label | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLabels(await listLabels());
    } catch (err: any) {
      toast.error('Load Failed', err?.message || 'Could not load labels');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function handleDelete(label: Label) {
    Alert.alert(
      'Delete Label',
      `Delete "${label.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLabel(label.id);
              setLabels((prev) => prev.filter((l) => l.id !== label.id));
              toast.success('Deleted');
            } catch (err: any) {
              toast.error('Failed', err?.response?.data?.message || err?.message || 'Could not delete (label may be in use)');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Labels" />

      {loading ? (
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
          <View style={styles.card}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={[styles.row, i > 1 && styles.rowDivider]}>
                <Skeleton width={18} height={18} radius={9} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="50%" height={14} radius={5} />
                  <Skeleton width="80%" height={11} radius={5} style={{ marginTop: 4 }} />
                </View>
                <Skeleton width={16} height={16} radius={8} />
                <Skeleton width={16} height={16} radius={8} />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {labels.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="tag" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No labels yet</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {labels.map((l, i) => (
                <View key={l.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={[styles.swatch, { backgroundColor: l.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{l.name}</Text>
                    {l.description ? <Text style={styles.desc}>{l.description}</Text> : null}
                  </View>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => setEditing(l)}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(l)}>
                    <Feather name="trash-2" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setCreating(true)} activeOpacity={0.85}>
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {creating && (
        <LabelForm
          onClose={() => setCreating(false)}
          onSaved={(l) => { setLabels((prev) => [l, ...prev]); setCreating(false); }}
        />
      )}
      {editing && (
        <LabelForm
          label={editing}
          onClose={() => setEditing(null)}
          onSaved={(l) => {
            setLabels((prev) => prev.map((x) => x.id === l.id ? l : x));
            setEditing(null);
          }}
        />
      )}
    </View>
  );
}

function LabelForm({
  label, onClose, onSaved,
}: { label?: Label; onClose: () => void; onSaved: (l: Label) => void }) {
  const { colors } = useTheme();
  const styles = useFormStyles();
  const toast = useToast();

  const [name, setName] = useState(label?.name ?? '');
  const [color, setColor] = useState(label?.color ?? PRESET_LABEL_COLORS[0]);
  const [description, setDescription] = useState(label?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [colorError, setColorError] = useState('');

  async function handleSave() {
    setNameError('');
    setColorError('');
    if (!name.trim()) { setNameError('Name is required'); return; }
    if (!isHexColor(color)) { setColorError('Invalid hex color (e.g. #6366F1)'); return; }
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), color, description: description.trim() || undefined };
      const saved = label
        ? await updateLabel(label.id, payload)
        : await createLabel(payload);
      onSaved(saved);
      toast.success(label ? 'Updated' : 'Created');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) setNameError('A label with this name already exists');
      else if (status === 400) setColorError(err?.response?.data?.message || 'Invalid input');
      else toast.error('Failed', err?.message || 'Could not save label');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {label ? 'Edit label' : 'New label'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setNameError(''); }}
            placeholder="Label name"
            placeholderTextColor={colors.textLight}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.background, borderColor: nameError ? colors.error : colors.border },
            ]}
          />
          {nameError ? <Text style={[styles.errorText, { color: colors.error }]}>{nameError}</Text> : null}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>Color</Text>
          <View style={styles.swatchRow}>
            {PRESET_LABEL_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  color === c && styles.swatchSelected,
                ]}
                onPress={() => { setColor(c); setColorError(''); }}
              />
            ))}
          </View>
          <TextInput
            value={color}
            onChangeText={(v) => { setColor(v); setColorError(''); }}
            placeholder="#RRGGBB"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.background, borderColor: colorError ? colors.error : colors.border, marginTop: spacing.sm },
            ]}
          />
          {colorError ? <Text style={[styles.errorText, { color: colors.error }]}>{colorError}</Text> : null}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={colors.textLight}
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
            ]}
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: colors.primary }, submitting && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : (
                <Text style={styles.btnPrimaryText}>{label ? 'Save' : 'Create'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    swatch: { width: 18, height: 18, borderRadius: 9 },
    name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
    desc: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
    iconBtn: { padding: 8 },

    empty: { alignItems: 'center', paddingVertical: spacing.xl * 2, gap: spacing.md },
    emptyText: { fontSize: fontSize.sm, color: colors.textLight },

    fab: {
      position: 'absolute',
      bottom: spacing.lg,
      right: spacing.lg,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
  }), [colors]);
}

function useFormStyles() {
  return React.useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: { fontSize: fontSize.lg, fontWeight: '700' },
    fieldLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: fontSize.md,
    },
    errorText: { fontSize: fontSize.xs, marginTop: 4 },

    swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    swatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchSelected: { borderColor: '#000' },

    btnSecondary: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
    },
    btnSecondaryText: { fontSize: fontSize.sm, fontWeight: '600' },
    btnPrimary: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnPrimaryText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  }), []);
}
