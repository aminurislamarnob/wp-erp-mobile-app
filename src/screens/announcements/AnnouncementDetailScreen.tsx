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
import { getAnnouncementDetail } from '../../api/endpoints';
import { Announcement } from '../../types';
import { colors, spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';

export default function AnnouncementDetailScreen() {
  const route = useRoute<any>();
  const { user } = useAuth();
  const { announcementId } = route.params;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getAnnouncementDetail(user.id, announcementId);
        setAnnouncement(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [announcementId]);

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

  if (!announcement) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color={colors.textLight} />
          <Text style={styles.errorText}>Could not load announcement</Text>
        </View>
      </View>
    );
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return (
    <View style={styles.container}>
    <AppHeader />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.iconWrap}>
          <Feather name="volume-2" size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{announcement.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="user" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{announcement.author}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatDate(announcement.date)}</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.bodyCard}>
        <Text style={styles.bodyText}>{stripHtml(announcement.body)}</Text>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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

  // Header card
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Body card
  bodyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
  },
  bodyText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 24,
  },
});
