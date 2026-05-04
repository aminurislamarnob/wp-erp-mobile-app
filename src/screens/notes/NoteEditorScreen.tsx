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
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import {
  getNote,
  createNote,
  updateNote,
  listLabels,
  createLabel,
} from '../../api/notes';
import { uploadWPMedia } from '../../api/endpoints';
import { Label, NoteAttachment } from '../../types';
import { stripHtml, paragraphsToHtml, isHexColor, PRESET_LABEL_COLORS } from './utils';

interface LocalFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

function fileIcon(mime: string): 'file-text' | 'image' | 'file' {
  if (mime.includes('pdf')) return 'file-text';
  if (mime.startsWith('image')) return 'image';
  return 'file';
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function NoteEditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useStyles();
  const noteId: number | undefined = route.params?.noteId;
  const isEdit = !!noteId;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [labels, setLabels] = useState<Label[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]); // already-uploaded (edit mode)
  const [pendingFiles, setPendingFiles] = useState<LocalFile[]>([]);    // newly-picked, upload on save
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load existing note + labels list
  useEffect(() => {
    listLabels().then(setAllLabels).catch(() => {});
    if (!isEdit) return;
    (async () => {
      try {
        const n = await getNote(noteId!);
        setTitle(n.title);
        setContent(stripHtml(n.content));
        setLabels(n.labels || []);
        setAttachments(n.attachments || []);
      } catch (err: any) {
        toast.error('Load Failed', err?.message || 'Could not load note');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [noteId, isEdit]);

  // Discard prompt on back nav with unsaved changes
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!dirty || saving) return;
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
    return unsub;
  }, [navigation, dirty, saving]);

  function markDirty<T>(setter: (v: T) => void): (v: T) => void {
    return (v: T) => { setter(v); setDirty(true); };
  }

  async function handlePickFiles() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const picked: LocalFile[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType || 'application/octet-stream',
        size: a.size,
      }));
      setPendingFiles((prev) => [...prev, ...picked]);
      setDirty(true);
    } catch {
      toast.error('Error', 'Failed to pick file');
    }
  }

  function removeAttachment(id: number) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setDirty(true);
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  async function handleSave() {
    Keyboard.dismiss();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');
    setSaving(true);
    try {
      // Upload pending files first to get WP media IDs
      const newIds: number[] = [];
      for (const file of pendingFiles) {
        const id = await uploadWPMedia(file.uri, file.name, file.mimeType);
        newIds.push(id);
      }

      const payload = {
        title: trimmed,
        content: paragraphsToHtml(content),
        label_ids: labels.map((l) => l.id),
        attachment_ids: [...attachments.map((a) => a.id), ...newIds],
      };

      if (isEdit) {
        await updateNote(noteId!, payload);
        toast.success('Saved', 'Note updated');
      } else {
        await createNote(payload);
        toast.success('Created', 'Note created');
      }
      setDirty(false);
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not save note';
      toast.error('Save Failed', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader showBack title={isEdit ? 'Edit Note' : 'New Note'} />
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
          {/* Title field */}
          <View style={styles.field}>
            <Skeleton width={48} height={10} radius={5} />
            <Skeleton width="100%" height={42} radius={10} style={{ marginTop: 8 }} />
          </View>
          {/* Labels field */}
          <View style={styles.field}>
            <Skeleton width={56} height={10} radius={5} />
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
              <Skeleton width={70} height={20} radius={10} />
              <Skeleton width={90} height={20} radius={10} />
            </View>
          </View>
          {/* Content field */}
          <View style={styles.field}>
            <Skeleton width={64} height={10} radius={5} />
            <Skeleton width="100%" height={160} radius={10} style={{ marginTop: 8 }} />
          </View>
          {/* Attachments field */}
          <View style={styles.field}>
            <Skeleton width={88} height={10} radius={5} />
            <Skeleton width="100%" height={48} radius={12} style={{ marginTop: 8 }} />
          </View>
          {/* Save button */}
          <Skeleton width="100%" height={48} radius={24} style={{ marginTop: spacing.sm }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack title={isEdit ? 'Edit Note' : 'New Note'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={markDirty(setTitle)}
            placeholder="Note title"
            placeholderTextColor={colors.textLight}
            style={[styles.input, titleError && { borderColor: colors.error }]}
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
        </View>

        {/* Labels */}
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Labels</Text>
            <TouchableOpacity onPress={() => setLabelPickerOpen(true)}>
              <Text style={styles.linkText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.labelPickerBtn} onPress={() => setLabelPickerOpen(true)}>
            {labels.length === 0 ? (
              <Text style={styles.placeholderText}>Tap to add labels</Text>
            ) : (
              <View style={styles.chipsRow}>
                {labels.map((l) => (
                  <View key={l.id} style={[styles.chip, { backgroundColor: l.color + '22' }]}>
                    <View style={[styles.chipDot, { backgroundColor: l.color }]} />
                    <Text style={[styles.chipText, { color: l.color }]}>{l.name}</Text>
                  </View>
                ))}
              </View>
            )}
            <Feather name="chevron-right" size={16} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Content</Text>
          <TextInput
            value={content}
            onChangeText={markDirty(setContent)}
            placeholder="Write your note…"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.contentInput]}
          />
        </View>

        {/* Attachments */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Attachments</Text>

          {attachments.map((a) => (
            <View key={`u-${a.id}`} style={styles.fileCard}>
              <Feather name={fileIcon(a.mime_type || '')} size={20} color={colors.primary} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{a.filename || `Attachment #${a.id}`}</Text>
                {a.size ? <Text style={styles.fileSize}>{formatFileSize(a.size)}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => removeAttachment(a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {pendingFiles.map((file, i) => (
            <View key={`p-${i}`} style={styles.fileCard}>
              <Feather name={fileIcon(file.mimeType)} size={20} color={colors.primary} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSize}>
                  {formatFileSize(file.size)}{file.size ? ' · ' : ''}Pending upload
                </Text>
              </View>
              <TouchableOpacity onPress={() => removePendingFile(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.attachBtn, { marginTop: (attachments.length + pendingFiles.length) > 0 ? spacing.sm : 0 }]}
            onPress={handlePickFiles}
            activeOpacity={0.7}
          >
            <Feather name="paperclip" size={16} color={colors.primary} />
            <Text style={styles.attachBtnText}>Add File</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>PDF, JPG or PNG · Max 10 MB each</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Note'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <LabelPickerModal
        visible={labelPickerOpen}
        onClose={() => setLabelPickerOpen(false)}
        all={allLabels}
        selected={labels}
        onChange={(next) => { setLabels(next); setDirty(true); }}
        onCreated={(l) => { setAllLabels((prev) => [l, ...prev]); }}
      />
    </View>
  );
}

// ─── Label picker modal ───

function LabelPickerModal({
  visible, onClose, all, selected, onChange, onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  all: Label[];
  selected: Label[];
  onChange: (next: Label[]) => void;
  onCreated: (l: Label) => void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useModalStyles();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_LABEL_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [colorError, setColorError] = useState('');

  const filtered = search
    ? all.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : all;

  function toggle(l: Label) {
    const isSelected = selected.some((s) => s.id === l.id);
    onChange(isSelected ? selected.filter((s) => s.id !== l.id) : [...selected, l]);
  }

  async function handleCreate() {
    setNameError('');
    setColorError('');
    if (!newName.trim()) {
      setNameError('Name is required');
      return;
    }
    if (!isHexColor(newColor)) {
      setColorError('Invalid hex color');
      return;
    }
    setSubmitting(true);
    try {
      const l = await createLabel({ name: newName.trim(), color: newColor });
      onCreated(l);
      onChange([...selected, l]);
      setNewName('');
      setNewColor(PRESET_LABEL_COLORS[0]);
      setCreating(false);
      toast.success('Created', 'Label added');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) setNameError('A label with this name already exists');
      else if (status === 400) setColorError(err?.response?.data?.message || 'Invalid input');
      else toast.error('Failed', err?.message || 'Could not create label');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Labels</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!creating ? (
            <>
              <View style={[styles.searchBox, { backgroundColor: colors.background }]}>
                <Feather name="search" size={14} color={colors.textLight} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search labels…"
                  placeholderTextColor={colors.textLight}
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>

              <ScrollView style={{ maxHeight: 320 }}>
                {filtered.map((l) => {
                  const isSel = selected.some((s) => s.id === l.id);
                  return (
                    <TouchableOpacity
                      key={l.id}
                      style={styles.row}
                      onPress={() => toggle(l)}
                    >
                      <View style={[styles.dot, { backgroundColor: l.color }]} />
                      <Text style={[styles.rowName, { color: colors.text }]}>{l.name}</Text>
                      {isSel && <Feather name="check" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
                {filtered.length === 0 && (
                  <Text style={[styles.empty, { color: colors.textLight }]}>No labels found</Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.newBtn, { backgroundColor: colors.primary + '15' }]}
                onPress={() => setCreating(true)}
              >
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={[styles.newBtnText, { color: colors.primary }]}>New label</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                value={newName}
                onChangeText={(v) => { setNewName(v); setNameError(''); }}
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
                      newColor === c && styles.swatchSelected,
                    ]}
                    onPress={() => { setNewColor(c); setColorError(''); }}
                  />
                ))}
              </View>
              <TextInput
                value={newColor}
                onChangeText={(v) => { setNewColor(v); setColorError(''); }}
                placeholder="#RRGGBB"
                placeholderTextColor={colors.textLight}
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.background, borderColor: colorError ? colors.error : colors.border, marginTop: spacing.sm },
                ]}
                autoCapitalize="none"
              />
              {colorError ? <Text style={[styles.errorText, { color: colors.error }]}>{colorError}</Text> : null}

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <TouchableOpacity
                  style={[styles.btnSecondary, { borderColor: colors.border }]}
                  onPress={() => setCreating(false)}
                  disabled={submitting}
                >
                  <Text style={[styles.btnSecondaryText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnPrimary, { backgroundColor: colors.primary }, submitting && { opacity: 0.6 }]}
                  onPress={handleCreate}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Create</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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

    field: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm + 2,
    },
    fieldHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    linkText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '600',
    },
    placeholderText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      paddingVertical: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: fontSize.md,
      color: colors.text,
      backgroundColor: colors.background,
    },
    contentInput: {
      minHeight: 160,
      paddingTop: spacing.sm + 2,
    },
    errorText: {
      fontSize: fontSize.xs,
      color: colors.error,
      marginTop: 4,
    },

    labelPickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 44,
    },
    chipsRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 6,
    },
    chipDot: { width: 8, height: 8, borderRadius: 4 },
    chipText: { fontSize: fontSize.xs, fontWeight: '600' },

    attachBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    attachBtnText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    fileCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    fileInfo: { flex: 1 },
    fileName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    fileSize: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: spacing.xs,
    },

    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    saveBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  }), [colors]);
}

function useModalStyles() {
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
      maxHeight: '85%',
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sheetTitle: { fontSize: fontSize.lg, fontWeight: '700' },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: 10,
      gap: spacing.sm,
      height: 40,
      marginBottom: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: fontSize.sm, padding: 0 },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      gap: spacing.md,
    },
    dot: { width: 14, height: 14, borderRadius: 7 },
    rowName: { flex: 1, fontSize: fontSize.md, fontWeight: '500' },
    empty: { textAlign: 'center', paddingVertical: spacing.lg, fontSize: fontSize.sm },

    newBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + 2,
      borderRadius: 10,
      gap: 6,
      marginTop: spacing.sm,
    },
    newBtnText: { fontSize: fontSize.sm, fontWeight: '700' },

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

    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    swatch: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchSelected: {
      borderColor: '#000',
    },

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

