import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize } from '../constants/theme';

export default function AppHeader({ showBack }: { showBack?: boolean } = {}) {
  const { employee, logout } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) + spacing.md, backgroundColor: colors.primary }]}>
      <View style={styles.headerLeft}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        {employee?.avatar_url ? (
          <Image source={{ uri: employee.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primaryDark }]}>
            <Text style={styles.avatarInitial}>
              {employee?.first_name?.[0] || 'E'}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {employee?.full_name || 'Employee'}
          </Text>
          <Text style={styles.headerDesignation} numberOfLines={1}>
            {employee?.designation?.title || ''}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
        <Feather name="log-out" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  headerDesignation: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
