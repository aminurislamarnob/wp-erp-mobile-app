import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import {
  getNote,
  pinNote,
  unpinNote,
  archiveNote,
  unarchiveNote,
  deleteNote,
} from '../../api/notes';
import { Note } from '../../types';
import { stripHtml, formatNoteDate } from './utils';

export default function NoteDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useStyles();
  const noteId: number = route.params?.noteId;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getNote(noteId);
      setNote(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load note');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  async function togglePin() {
    if (!note) return;
    const next = !note.pinned;
    setNote({ ...note, pinned: next });
    try {
      if (next) await pinNote(note.id);
      else await unpinNote(note.id);
      toast.success(next ? 'Pinned' : 'Unpinned');
    } catch (err: any) {
      setNote({ ...note, pinned: !next });
      toast.error('Failed', err?.message || 'Could not update pin');
    }
  }

  async function toggleArchive() {
    if (!note) return;
    const next = !note.archived;
    try {
      if (next) await archiveNote(note.id);
      else await unarchiveNote(note.id);
      toast.success(next ? 'Archived' : 'Unarchived');
      navigation.goBack();
    } catch (err: any) {
      toast.error('Failed', err?.message || 'Could not update archive');
    }
  }

  function handleDelete() {
    if (!note) return;
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id);
              toast.success('Deleted');
              navigation.goBack();
            } catch (err: any) {
              toast.error('Failed', err?.message || 'Could not delete note');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader showBack title="Note" />
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
          {/* Header card skeleton */}
          <View style={styles.headerCard}>
            <Skeleton width="80%" height={22} radius={6} />
            <View style={[styles.metaRow, { marginTop: spacing.sm }]}>
              <Skeleton width={90} height={11} radius={5} />
              <Skeleton width={60} height={11} radius={5} style={{ marginLeft: spacing.md }} />
            </View>
            <View style={[styles.labelsRow, { marginTop: spacing.md }]}>
              <Skeleton width={70} height={20} radius={10} />
              <Skeleton width={90} height={20} radius={10} />
            </View>
          </View>

          {/* Action row skeleton */}
          <View style={styles.actions}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.actionBtn}>
                <Skeleton width={40} height={40} radius={20} />
                <Skeleton width={36} height={10} radius={5} style={{ marginTop: 4 }} />
              </View>
            ))}
          </View>

          {/* Body card skeleton */}
          <View style={styles.bodyCard}>
            <Skeleton width="100%" height={14} radius={5} />
            <Skeleton width="95%" height={14} radius={5} style={{ marginTop: 8 }} />
            <Skeleton width="90%" height={14} radius={5} style={{ marginTop: 8 }} />
            <Skeleton width="60%" height={14} radius={5} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !note) {
    return (
      <View style={styles.container}>
        <AppHeader showBack title="Note" />
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>{error || 'Could not load note'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isImage = (mime?: string) => !!mime && mime.startsWith('image/');

  return (
    <View style={styles.container}>
      <AppHeader showBack title="Note" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Title + meta */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>{note.title || 'Untitled'}</Text>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatNoteDate(note.updated_at || note.created_at)}</Text>
            {note.pinned && (
              <>
                <Feather name="bookmark" size={13} color={colors.warning} style={{ marginLeft: spacing.md }} />
                <Text style={[styles.metaText, { color: colors.warning }]}>Pinned</Text>
              </>
            )}
            {note.archived && (
              <>
                <Feather name="archive" size={13} color={colors.textLight} style={{ marginLeft: spacing.md }} />
                <Text style={styles.metaText}>Archived</Text>
              </>
            )}
          </View>

          {note.labels?.length ? (
            <View style={styles.labelsRow}>
              {note.labels.map((l) => (
                <View key={l.id} style={[styles.labelChip, { backgroundColor: l.color + '22' }]}>
                  <View style={[styles.labelDot, { backgroundColor: l.color }]} />
                  <Text style={[styles.labelChipText, { color: l.color }]}>{l.name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Action row */}
        <View style={styles.actions}>
          <ActionBtn icon="edit-3" label="Edit" onPress={() => navigation.navigate('NoteEditor', { noteId: note.id })} />
          <ActionBtn icon={note.pinned ? 'bookmark' : 'bookmark'} label={note.pinned ? 'Unpin' : 'Pin'} onPress={togglePin} />
          <ActionBtn icon="archive" label={note.archived ? 'Unarchive' : 'Archive'} onPress={toggleArchive} />
          <ActionBtn icon="trash-2" label="Delete" danger onPress={handleDelete} />
        </View>

        {/* Body */}
        {note.content ? (
          <View style={styles.bodyCard}>
            <Text style={styles.bodyText}>{stripHtml(note.content)}</Text>
          </View>
        ) : null}

        {/* Attachments */}
        {note.attachments?.length ? (
          <View style={styles.attachCard}>
            <Text style={styles.sectionLabel}>Attachments</Text>
            <View style={styles.attachGrid}>
              {note.attachments.map((a) => (
                isImage(a.mime_type) && a.url ? (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.attachImageWrap}
                    onPress={() => a.url && Linking.openURL(a.url)}
                  >
                    <Image source={{ uri: a.url }} style={styles.attachImage} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.fileRow}
                    onPress={() => a.url && Linking.openURL(a.url)}
                  >
                    <Feather name="paperclip" size={18} color={colors.primary} />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {a.filename || `Attachment #${a.id}`}
                    </Text>
                    <Feather name="external-link" size={14} color={colors.textLight} />
                  </TouchableOpacity>
                )
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ActionBtn({
  icon, label, onPress, danger,
}: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const tint = danger ? colors.error : colors.primary;
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: tint + '15' }]}>
        <Feather name={icon} size={18} color={tint} />
      </View>
      <Text style={[styles.actionLabel, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
    errorText: { fontSize: fontSize.sm, color: colors.textLight },
    retryBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    retryBtnText: { color: '#fff', fontWeight: '600' },

    content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

    headerCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: { fontSize: fontSize.xs, color: colors.textSecondary },
    labelsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: spacing.md,
    },
    labelChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 6,
    },
    labelChipText: { fontSize: fontSize.xs, fontWeight: '600' },
    labelDot: { width: 8, height: 8, borderRadius: 4 },

    actions: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.md,
      justifyContent: 'space-around',
    },
    actionBtn: { alignItems: 'center', flex: 1 },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    actionLabel: { fontSize: fontSize.xs, fontWeight: '600' },

    bodyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    bodyText: {
      fontSize: fontSize.sm,
      color: colors.text,
      lineHeight: 22,
    },

    attachCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    attachGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    attachImageWrap: {
      width: 100,
      height: 100,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    attachImage: { width: '100%', height: '100%' },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      gap: spacing.sm,
    },
    fileName: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.text,
    },
  }), [colors]);
}
