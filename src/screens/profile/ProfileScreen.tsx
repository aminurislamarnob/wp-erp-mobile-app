import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../constants/theme';

export default function ProfileScreen() {
  const { employee } = useAuth();

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text>No profile data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        {employee.avatar_url ? (
          <Image source={{ uri: employee.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{employee.first_name?.[0] || 'E'}</Text>
          </View>
        )}
        <Text style={styles.name}>{employee.full_name}</Text>
        <Text style={styles.designation}>
          {employee.designation?.title || ''}
          {employee.department ? ` - ${employee.department.title}` : ''}
        </Text>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        <InfoRow label="Date of Birth" value={employee.date_of_birth} />
        <InfoRow label="Gender" value={employee.gender} />
        <InfoRow label="Marital Status" value={employee.marital_status} />
        <InfoRow label="Nationality" value={employee.nationality} />
        <InfoRow label="Blood Group" value={employee.blood_group} />
      </View>

      {/* Contact Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <InfoRow label="Phone" value={employee.phone} />
        <InfoRow label="Mobile" value={employee.mobile} />
        <InfoRow label="Work Phone" value={employee.work_phone} />
        <InfoRow label="Other Email" value={employee.other_email} />
      </View>

      {/* Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Address</Text>
        <InfoRow label="Street" value={employee.street_1} />
        {employee.street_2 && <InfoRow label="" value={employee.street_2} />}
        <InfoRow label="City" value={employee.city} />
        <InfoRow label="State" value={employee.state} />
        <InfoRow label="Postal Code" value={employee.postal_code} />
        <InfoRow label="Country" value={employee.country} />
      </View>

      {/* Job Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Job Information</Text>
        <InfoRow label="Department" value={employee.department?.title} />
        <InfoRow label="Designation" value={employee.designation?.title} />
        <InfoRow label="Reporting To" value={employee.reporting_to?.full_name} />
        <InfoRow label="Location" value={employee.location} />
        <InfoRow label="Employment Type" value={employee.type} />
        <InfoRow label="Status" value={employee.status} />
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      {label ? <Text style={styles.infoLabel}>{label}</Text> : null}
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  designation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});
