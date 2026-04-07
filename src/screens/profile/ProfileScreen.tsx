import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useToast } from '../../components/Toast';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import {
  getMyProfile,
  getMyExperiences,
  getMyEducations,
  getMyDependents,
  uploadPhoto,
} from '../../api/endpoints';
import { Employee } from '../../types';
import ClockFAB from '../../components/ClockFAB';

type TabKey = 'info' | 'experience' | 'education' | 'dependents';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'dependents', label: 'Dependents' },
];

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },

    // Header
    header: {
      alignItems: 'center',
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    avatarWrap: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
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
    avatarOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background,
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
    reportingTo: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    teamBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    teamBtnText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '600',
    },

    // Theme toggle
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: 100,
      padding: 4,
      gap: 4,
    },
    themeOption: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
    },
    themeOptionActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },

    // Tabs
    tabBar: {
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tabBarContent: {
      paddingHorizontal: spacing.md,
    },
    tab: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      marginRight: spacing.xs,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },

    // Tab content
    tabContent: {
      minHeight: 200,
    },

    // Cards
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
      borderBottomWidth: StyleSheet.hairlineWidth,
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
      textTransform: 'capitalize',
    },

    // Empty
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textLight,
    },
  }), [colors]);
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, employee: authEmployee } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const [employee, setEmployee] = useState<Employee | null>(authEmployee);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  const [subData, setSubData] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const userId = user?.id;

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getMyProfile(userId);
      setEmployee(data);
    } catch {
      // keep cached
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load sub-resource data when tab changes
  useEffect(() => {
    if (!userId || activeTab === 'info') {
      setSubData([]);
      return;
    }
    loadSubData();
  }, [activeTab, userId]);

  async function loadSubData() {
    if (!userId) return;
    setSubLoading(true);
    try {
      const fetchers: Record<string, (id: number) => Promise<any>> = {
        experience: getMyExperiences,
        education: getMyEducations,
        dependents: getMyDependents,
      };
      const result = await fetchers[activeTab](userId);
      setSubData(Array.isArray(result) ? result : []);
    } catch {
      setSubData([]);
    } finally {
      setSubLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadProfile();
    if (activeTab !== 'info') await loadSubData();
    setRefreshing(false);
  }

  async function handlePhotoUpload() {
    if (!userId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.warning('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      exif: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const uri = asset.uri;
    const name = asset.fileName || `photo_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';

    setUploading(true);
    try {
      await uploadPhoto(userId, uri, name, mimeType);
      await loadProfile();
      toast.success('Photo Updated', 'Your profile photo has been updated');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload photo. Please try again.';
      toast.error('Upload Failed', msg);
    } finally {
      setUploading(false);
    }
  }

  if (!employee) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <AppHeader />
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Profile Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePhotoUpload} activeOpacity={0.8}>
          <View style={styles.avatarWrap}>
            {employee.avatar_url ? (
              <Image source={{ uri: employee.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{employee.first_name?.[0] || 'E'}</Text>
              </View>
            )}
            {uploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <View style={styles.cameraIcon}>
                <Feather name="camera" size={14} color={colors.textSecondary} />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{employee.full_name}</Text>
        <Text style={styles.designation}>
          {employee.designation?.title || ''}
          {employee.department ? ` · ${employee.department.title}` : ''}
        </Text>
        <TouchableOpacity
          style={styles.teamBtn}
          onPress={() => navigation.navigate('TeamDirectory')}
        >
          <Text style={styles.teamBtnText}>Team Directory</Text>
        </TouchableOpacity>

        {/* Theme Toggle */}
        <View style={styles.themeToggle}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.themeOption, mode === m && styles.themeOptionActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
            >
              <Feather
                name={m === 'light' ? 'sun' : m === 'dark' ? 'moon' : 'monitor'}
                size={16}
                color={mode === m ? colors.text : colors.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Tab Content ── */}
      <View style={styles.tabContent}>
        {activeTab === 'info' ? (
          <ProfileInfo employee={employee} />
        ) : subLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : subData.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeTab} records found</Text>
          </View>
        ) : (
          <SubResourceList tab={activeTab} data={subData} />
        )}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
    <ClockFAB />
    </View>
  );
}

// ─── Profile Info Tab ───

function ProfileInfo({ employee }: { employee: Employee }) {
  const styles = useStyles();
  return (
    <>
      <Card title="Personal Information">
        <InfoRow label="Name" value={employee.full_name} />
        <InfoRow label="Employee ID" value={employee.employee_id} />
        <InfoRow label="Date of Birth" value={employee.date_of_birth} />
        <InfoRow label="Gender" value={employee.gender} />
        <InfoRow label="Marital Status" value={employee.marital_status} />
        <InfoRow label="Nationality" value={employee.nationality} noCapitalize />
        <InfoRow label="Blood Group" value={employee.blood_group} />
        <InfoRow label="Driving License" value={employee.driving_license} />
      </Card>

      <Card title="Contact Information">
        <InfoRow label="Phone" value={employee.phone} />
        <InfoRow label="Mobile" value={employee.mobile} />
        <InfoRow label="Work Phone" value={employee.work_phone} />
        <InfoRow label="Other Email" value={employee.other_email} noCapitalize />
        <InfoRow label="Street" value={employee.street_1} />
        {employee.street_2 ? <InfoRow label="" value={employee.street_2} /> : null}
        <InfoRow label="City" value={employee.city} />
        <InfoRow label="State" value={employee.state} noCapitalize />
        <InfoRow label="Postal Code" value={employee.postal_code} />
        <InfoRow label="Country" value={employee.country} noCapitalize />
      </Card>

      <Card title="Job Information">
        <InfoRow label="Department" value={employee.department?.title} />
        <InfoRow label="Designation" value={employee.designation?.title} />
        <InfoRow label="Reporting To" value={employee.reporting_to?.full_name} />
        <InfoRow label="Type" value={employee.type} />
        <InfoRow label="Source of Hire" value={employee.hiring_source} />
        <InfoRow label="Status" value={employee.status} />
      </Card>

      {(employee.hobbies || employee.description) && (
        <Card title="Other">
          <InfoRow label="Hobbies" value={employee.hobbies} />
          <InfoRow label="About" value={employee.description} />
        </Card>
      )}
    </>
  );
}

// ─── Sub-Resource List ───

function SubResourceList({ tab, data }: { tab: TabKey; data: any[] }) {
  switch (tab) {
    case 'experience':
      return (
        <>
          {data.map((item, i) => (
            <Card key={item.id || i} title={item.company_name || 'Company'}>
              <InfoRow label="Designation" value={item.job_title} />
              <InfoRow label="From" value={item.from} />
              <InfoRow label="To" value={item.to || 'Present'} />
              <InfoRow label="Description" value={item.description} />
            </Card>
          ))}
        </>
      );
    case 'education':
      return (
        <>
          {data.map((item, i) => {
            let result = item.result;
            // Parse JSON string if needed
            if (typeof result === 'string') {
              try { result = JSON.parse(result); } catch { /* keep as string */ }
            }
            let resultStr: string | undefined;
            if (result && typeof result === 'object' && ('gpa' in result || 'scale' in result)) {
              resultStr = `${result.gpa || ''} out of ${result.scale || ''}`;
            } else if (result) {
              resultStr = String(result);
            }

            let resultType = item.result_type;
            if (resultType && typeof resultType === 'object') {
              resultType = resultType.name || resultType.label || JSON.stringify(resultType);
            }

            return (
              <Card key={item.id || i} title={item.school || 'Institution'}>
                <InfoRow label="Degree" value={item.degree} />
                <InfoRow label="Field" value={item.field} />
                <InfoRow label="Finished" value={item.finished} />
                <InfoRow label="Result Type" value={resultType} />
                <InfoRow label="Result" value={resultStr} />
                <InfoRow label="Notes" value={item.notes} />
              </Card>
            );
          })}
        </>
      );
    case 'dependents':
      return (
        <>
          {data.map((item, i) => (
            <Card key={item.id || i} title={item.name || 'Dependent'}>
              <InfoRow label="Relation" value={item.relation} />
              <InfoRow label="Date of Birth" value={parseDateValue(item.date_of_birth || item.dob)} />
            </Card>
          ))}
        </>
      );
    default:
      return null;
  }
}

// ─── Shared Components ───

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value, noCapitalize }: { label: string; value?: string; noCapitalize?: boolean }) {
  const styles = useStyles();
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      {label ? <Text style={styles.infoLabel}>{label}</Text> : null}
      <Text style={[styles.infoValue, noCapitalize && { textTransform: 'none' }]}>{value}</Text>
    </View>
  );
}

function parseDateValue(value: string | number | undefined): string | undefined {
  if (!value) return undefined;
  const num = Number(value);
  if (!isNaN(num) && num > 100000) {
    const d = new Date(num * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(value);
}
