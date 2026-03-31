import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../constants/theme';

export default function ReimbursementScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reimbursement — Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
