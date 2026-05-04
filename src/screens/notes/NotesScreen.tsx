import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';
import { Skeleton } from '../../components/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../components/Toast';
import { spacing, fontSize } from '../../constants/theme';
import {
  listNotes,
  pinNote,
  unpinNote,
  archiveNote,
  unarchiveNote,
  deleteNote,
  listLabels,
} from '../../api/notes';
import { Note, Label, NoteListFilters } from '../../types';
import { snippet, formatNoteDate } from './utils';

type Segment = 'all' | 'pinned' | 'archived';

export default function NotesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = useStyles();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();

  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Read filters returned from NoteFilter screen
  useEffect(() => {
    const params = route.params;
    if (!params) return;
    if (params.appliedFilters) {
      const f = params.appliedFilters;
      setSelectedLabelIds(f.label_ids || []);
      setDateFrom(f.date_from);
      setDateTo(f.date_to);
      navigation.setParams({ appliedFilters: undefined });
    }
  }, [route.params]);

  const filters = useMemo<NoteListFilters>(() => ({
    search: debouncedSearch || undefined,
    label_ids: selectedLabelIds.length ? selectedLabelIds : undefined,
    date_from: dateFrom,
    date_to: dateTo,
    pinned: segment === 'pinned' ? true : undefined,
    archived: segment === 'archived' ? true : undefined,
    per_page: 20,
  }), [debouncedSearch, selectedLabelIds, dateFrom, dateTo, segment]);

  const load = useCallback(async (pageNum = 1, append = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await listNotes({ ...filters, page: pageNum }, controller.signal);
      if (controller.signal.aborted) return;
      setNotes((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotalPages(res.totalPages || 1);
      setPage(pageNum);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      // Graceful 404 (module disabled) → empty state
      if (err?.response?.status === 404) {
        setNotes([]);
        setTotalPages(1);
        return;
      }
      toast.error('Load Failed', err?.message || 'Failed to load notes');
    }
  }, [filters, toast]);

  // Reload when filters change
  useEffect(() => {
    setLoading(true);
    load(1, false).finally(() => setLoading(false));
    return () => abortRef.current?.abort();
  }, [load]);

  // Reload labels and notes on focus
  useFocusEffect(
    useCallback(() => {
      listLabels().then(setLabels).catch(() => {});
      // refresh list silently to pick up changes from detail/editor screens
      load(1, false);
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      load(1, false),
      listLabels().then(setLabels).catch(() => {}),
    ]);
    setRefreshing(false);
  }

  async function onLoadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  }

  function toggleLabel(id: number) {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Optimistic mutations
  async function handlePin(note: Note) {
    const next = !note.pinned;
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, pinned: next } : n));
    try {
      if (next) await pinNote(note.id);
      else await unpinNote(note.id);
    } catch (err: any) {
      setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, pinned: !next } : n));
      toast.error('Failed', err?.message || 'Could not update pin');
    }
  }

  async function handleArchive(note: Note) {
    const next = !note.archived;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    try {
      if (next) await archiveNote(note.id);
      else await unarchiveNote(note.id);
    } catch (err: any) {
      setNotes((prev) => [note, ...prev]);
      toast.error('Failed', err?.message || 'Could not update archive');
    }
  }

  async function handleDelete(note: Note) {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const prev = notes;
            setNotes((cur) => cur.filter((n) => n.id !== note.id));
            try {
              await deleteNote(note.id);
              toast.success('Deleted', 'Note removed');
            } catch (err: any) {
              setNotes(prev);
              toast.error('Failed', err?.message || 'Could not delete note');
            }
          },
        },
      ]
    );
  }

  function showRowActions(note: Note) {
    Alert.alert(
      note.title || 'Note',
      undefined,
      [
        { text: note.pinned ? 'Unpin' : 'Pin', onPress: () => handlePin(note) },
        { text: note.archived ? 'Unarchive' : 'Archive', onPress: () => handleArchive(note) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(note) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  const activeFilterCount =
    (selectedLabelIds.length ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  function renderItem({ item }: { item: Note }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        onLongPress={() => showRowActions(item)}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleRow}>
            {item.pinned && (
              <Feather name="bookmark" size={14} color={colors.warning} style={{ marginRight: 6 }} />
            )}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || 'Untitled'}
            </Text>
          </View>
          <Text style={styles.cardDate}>{formatNoteDate(item.updated_at || item.created_at)}</Text>
        </View>
        {item.content ? (
          <Text style={styles.cardSnippet} numberOfLines={2}>
            {snippet(item.content)}
          </Text>
        ) : null}
        {item.labels?.length ? (
          <View style={styles.cardLabels}>
            {item.labels.slice(0, 2).map((l) => (
              <View key={l.id} style={[styles.labelChip, { backgroundColor: l.color + '22' }]}>
                <View style={[styles.labelDot, { backgroundColor: l.color }]} />
                <Text style={[styles.labelChipText, { color: l.color }]} numberOfLines={1}>
                  {l.name}
                </Text>
              </View>
            ))}
            {item.labels.length > 2 && (
              <Text style={styles.labelOverflow}>+{item.labels.length - 2}</Text>
            )}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack title="My Notes" />

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.textLight} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes…"
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() =>
            navigation.navigate('NoteFilter', {
              labels,
              initial: { label_ids: selectedLabelIds, date_from: dateFrom, date_to: dateTo },
            })
          }
        >
          <Feather name="filter" size={16} color={colors.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View style={styles.segmentRow}>
        {(['all', 'pinned', 'archived'] as Segment[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.segment, segment === s && styles.segmentActive]}
            onPress={() => setSegment(s)}
          >
            <Text style={[styles.segmentText, segment === s && styles.segmentTextActive]}>
              {s === 'all' ? 'All' : s === 'pinned' ? 'Pinned' : 'Archived'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Label chips */}
      {labels.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.labelRow}
        >
          {labels.map((l) => {
            const active = selectedLabelIds.includes(l.id);
            return (
              <TouchableOpacity
                key={l.id}
                style={[
                  styles.filterLabel,
                  active && { backgroundColor: l.color + '33', borderColor: l.color },
                ]}
                onPress={() => toggleLabel(l.id)}
              >
                <View style={[styles.labelDot, { backgroundColor: l.color }]} />
                <Text style={[styles.filterLabelText, active && { color: l.color }]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.card}>
              <View style={styles.cardTop}>
                <Skeleton width="60%" height={16} radius={6} />
                <Skeleton width={56} height={11} radius={5} />
              </View>
              <Skeleton width="95%" height={12} radius={5} style={{ marginTop: 8 }} />
              <Skeleton width="80%" height={12} radius={5} style={{ marginTop: 4 }} />
              <View style={[styles.cardLabels, { marginTop: spacing.sm }]}>
                <Skeleton width={60} height={18} radius={9} />
                <Skeleton width={80} height={18} radius={9} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {segment === 'archived' ? 'No archived notes' :
                  segment === 'pinned' ? 'No pinned notes' :
                  activeFilterCount || debouncedSearch ? 'No notes match your filters' :
                  'No notes yet — tap + to create one'}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.md }} />
            ) : null
          }
        />
      )}

      {/* Create FAB */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('NoteEditor')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    searchRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      height: 40,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: fontSize.sm,
      padding: 0,
    },
    filterBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    segmentRow: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      alignItems: 'center',
    },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentTextActive: { color: '#fff' },

    labelRow: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    filterLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
      marginRight: 6,
    },
    filterLabelText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    labelDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    listContent: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm + 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.sm,
    },
    cardTitle: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    cardDate: {
      fontSize: fontSize.xs,
      color: colors.textLight,
    },
    cardSnippet: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    cardLabels: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
      gap: 6,
    },
    labelChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
      maxWidth: 140,
    },
    labelChipText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    labelOverflow: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      fontWeight: '600',
    },

    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
      gap: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },

    createBtn: {
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
