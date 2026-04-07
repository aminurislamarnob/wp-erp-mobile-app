import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { getTeamDirectory } from '../../api/endpoints';
import { Employee } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
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
    searchWrap: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarPlaceholder: {
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '600',
    },
    itemInfo: {
      marginLeft: spacing.md,
      flex: 1,
    },
    itemName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
    },
    itemSub: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },
  }), [colors]);
}

export default function TeamDirectoryScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadData = useCallback(
    async (pageNum = 1, searchTerm?: string) => {
      try {
        const result = await getTeamDirectory(pageNum, 20, searchTerm || undefined);
        if (pageNum === 1) {
          setEmployees(result.data);
        } else {
          setEmployees((prev) => [...prev, ...result.data]);
        }
        setTotalPages(result.totalPages);
        setPage(pageNum);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      loadData(1, search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  function loadMore() {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    loadData(page + 1, search || undefined);
  }

  function renderItem({ item }: { item: Employee }) {
    return (
      <View style={styles.item}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.first_name?.[0] || '?'}</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.full_name}</Text>
          <Text style={styles.itemSub}>
            {item.designation?.title || ''}
            {item.department ? ` · ${item.department.title}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => String(item.user_id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.md }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {search ? 'No employees found' : 'No team members yet'}
              </Text>
            </View>
          }
        />
      )}
      <ClockFAB />
    </View>
  );
}
