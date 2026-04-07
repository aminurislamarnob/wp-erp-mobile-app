import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../constants/theme';
import { getSelfAttendance } from '../api/endpoints';

export default function ClockFAB() {
  const navigation = useNavigation<any>();
  const { isModuleActive } = useAuth();
  const { colors } = useTheme();
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
          Animated.timing(pulse, { toValue: 1.18, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
    }
  }, [checkedIn, pulse]);

  if (!isModuleActive('attendance')) return null;

  return (
    <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulse }] }]}>
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: checkedIn ? colors.success : colors.primary,
            shadowColor: checkedIn ? colors.success : colors.primary,
          },
        ]}
        onPress={() => navigation.navigate('Attendance', { initialTab: 'clock' })}
        activeOpacity={0.8}
      >
        <Feather name="clock" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
