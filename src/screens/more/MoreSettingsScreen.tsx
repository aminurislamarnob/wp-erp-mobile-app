import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import AppHeader from '../../components/AppHeader';

export default function MoreSettingsScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader showBack title="Settings" />
    </View>
  );
}
