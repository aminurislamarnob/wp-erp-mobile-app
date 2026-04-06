import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, fontSize } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    text: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
  }), [colors]);
}

export default function ReimbursementScreen() {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reimbursement — Coming Soon</Text>
    </View>
  );
}
