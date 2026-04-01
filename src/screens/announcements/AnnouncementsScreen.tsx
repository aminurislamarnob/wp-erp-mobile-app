import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';
import { getMyAnnouncements } from '../../api/endpoints';
import { Announcement } from '../../types';
import { colors, spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

const ACCENT_COLORS = [colors.primary, colors.success, colors.warning, colors.info, colors.error];

export default function AnnouncementsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const toast = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadAnnouncements = useCallback(async (pageNum = 1, append = false) => {
    if (!user) return;
    try {
      const res = await getMyAnnouncements(user.id, pageNum, 15);
      if (append) {
        setAnnouncements((prev) => [...prev, ...res.data]);
      } else {
        setAnnouncements(res.data);
      }
      setTotalPages(res.totalPages);
      setPage(pageNum);
    } catch (err: any) {
      toast.error('Load Failed', err?.message || 'Failed to load announcements');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadAnnouncements(1).finally(() => setLoading(false));
    }, [loadAnnouncements])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadAnnouncements(1);
    setRefreshing(false);
  }

  async function onLoadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await loadAnnouncements(page + 1, true);
    setLoadingMore(false);
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <AppHeader />
    <FlatList
      style={{ flex: 1 }}
      data={announcements}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: item.id })}
        >
          <View style={[styles.cardAccent, { backgroundColor: ACCENT_COLORS[index % ACCENT_COLORS.length] }]} />
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
              <Feather name="chevron-right" size={16} color={colors.textLight} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {item.body ? (
              <Text style={styles.cardBody} numberOfLines={2}>
                {stripHtml(item.body)}
              </Text>
            ) : null}
            <View style={styles.cardBottom}>
              <View style={styles.authorChip}>
                <Feather name="user" size={11} color={colors.primary} />
                <Text style={styles.authorText}>{item.author}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="volume-x" size={48} color={colors.textLight} />
          <Text style={styles.emptyText}>No announcements</Text>
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.md }} />
        ) : null
      }
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  authorText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
});
