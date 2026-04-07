import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../constants/theme';

export default function ClockFAB() {
  const navigation = useNavigation<any>();
  const { isModuleActive } = useAuth();
  const { colors } = useTheme();

  if (!isModuleActive('attendance')) return null;

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      onPress={() => navigation.navigate('Attendance')}
      activeOpacity={0.8}
    >
      <Feather name="clock" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
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
