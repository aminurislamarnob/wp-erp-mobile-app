import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import AppHeader from '../../components/AppHeader';
import ClockFAB from '../../components/ClockFAB';

export default function MoreSettingsScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader showBack />
      <ClockFAB />
    </View>
  );
}
