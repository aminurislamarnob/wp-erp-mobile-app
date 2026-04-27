import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, fontSize } from '../constants/theme';
import { getSelfAttendance } from '../api/endpoints';

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
}

export default function AppHeader({ showBack, title }: AppHeaderProps) {
  const { employee, isModuleActive } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Clock state for the attendance quick-access icon
  const [checkedIn, setCheckedIn] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (!isModuleActive('attendance')) return;
      (async () => {
        try {
          const res = await getSelfAttendance();
          const att = res.attendance;
          const isIn = att?.min_checkin && att.min_checkin !== '00:00:00'
            && (!att.max_checkout || att.max_checkout === '00:00:00');
          setCheckedIn(!!isIn);
        } catch {
          setCheckedIn(false);
        }
      })();
    }, [isModuleActive])
  );

  useEffect(() => {
    if (checkedIn) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [checkedIn, pulse]);

  const isHome = !showBack && !title;
  const clockColor = checkedIn ? '#34D399' : 'rgba(255,255,255,0.85)';

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) + spacing.sm, backgroundColor: colors.primary }]}>
      {/* Left side */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        )}

        {isHome ? (
          /* Home: avatar + name + designation */
          <>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
              {employee?.avatar_url ? (
                <Image source={{ uri: employee.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primaryDark }]}>
                  <Text style={styles.avatarInitial}>{employee?.first_name?.[0] || 'E'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>{employee?.full_name || 'Employee'}</Text>
              <Text style={styles.designation} numberOfLines={1}>
                {employee?.designation?.title ?? ''}
              </Text>
            </View>
          </>
        ) : (
          /* Inner screen: page title */
          <Text style={styles.pageTitle} numberOfLines={1}>{title ?? ''}</Text>
        )}
      </View>

      {/* Right side: clock quick-access */}
      {isModuleActive('attendance') ? (
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            style={[styles.clockBtn, { backgroundColor: checkedIn ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.15)' }]}
            onPress={() => navigation.navigate('Attendance', { initialTab: 'clock' })}
            activeOpacity={0.7}
          >
            <Feather name="clock" size={18} color={clockColor} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.sm,
    padding: 4,
  },

  // Home profile
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  designation: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSize.xs,
    marginTop: 1,
  },

  // Inner page title
  pageTitle: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },

  // Clock button
  clockBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
