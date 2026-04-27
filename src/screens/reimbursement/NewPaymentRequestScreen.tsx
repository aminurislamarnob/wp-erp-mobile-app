import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import { useToast } from '../../components/Toast';
import { uploadWPMedia, createPaymentRequest, getCurrency } from '../../api/endpoints';

interface LocalFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function displayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileIcon(mime: string): 'file-text' | 'image' | 'file' {
  if (mime.includes('pdf')) return 'file-text';
  if (mime.startsWith('image')) return 'image';
  return 'file';
}

function useStyles() {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: 100 },

    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontSize: fontSize.md,
      color: colors.text,
    },
    textArea: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontSize: fontSize.md,
      color: colors.text,
      minHeight: 96,
      textAlignVertical: 'top',
    },
    dateRow: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      gap: spacing.sm,
    },
    dateText: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.text,
    },
    dateClear: {
      padding: 4,
    },

    // Attachments
    attachBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    attachBtnText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    fileCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    fileInfo: { flex: 1 },
    fileName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    fileSize: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },

    hint: {
      fontSize: fontSize.xs,
      color: colors.textLight,
      marginTop: spacing.xs,
    },

    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacing.md,
      paddingBottom: spacing.md + spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    submitBtnText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: '700',
    },
  }), [colors]);
}

export default function NewPaymentRequestScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const navigation = useNavigation<any>();
  const toast = useToast();

  const [currency, setCurrency] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => { getCurrency().then(setCurrency).catch(() => {}); }, []);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [expectDate, setExpectDate] = useState<Date | null>(null);
  const [showPurchasePicker, setShowPurchasePicker] = useState(false);
  const [showExpectPicker, setShowExpectPicker] = useState(false);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handlePickFiles() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const picked: LocalFile[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        mimeType: a.mimeType || 'application/octet-stream',
        size: a.size,
      }));
      setFiles((prev) => [...prev, ...picked]);
    } catch {
      toast.error('Error', 'Failed to pick file');
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim()) return toast.error('Validation', 'Title is required');
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return toast.error('Validation', 'Enter a valid amount greater than 0');
    if (!description.trim()) return toast.error('Validation', 'Description is required');
    if (files.length === 0) return toast.error('Validation', 'At least one attachment is required');

    setSubmitting(true);
    try {
      // Upload all files first to get WP media IDs
      const attachmentIds: number[] = [];
      for (const file of files) {
        const id = await uploadWPMedia(file.uri, file.name, file.mimeType);
        attachmentIds.push(id);
      }

      await createPaymentRequest({
        title: title.trim(),
        amount: parsedAmount,
        description: description.trim(),
        ...(purchaseDate ? { purchase_date: formatDateStr(purchaseDate) } : {}),
        ...(expectDate ? { expect_payment_by: formatDateStr(expectDate) } : {}),
        attachment_ids: attachmentIds,
      });

      toast.success('Request submitted', 'Your payment request has been sent');
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Could not submit request';
      toast.error('Submission failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader showBack title="New Payment Request" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={`e.g. Claude Code AI Subscription - ${new Date().toLocaleDateString('en-US', { month: 'long' })}`}
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.label}>Amount *{currency ? <Text style={{ color: colors.primary }}> ({currency})</Text> : null}</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textLight}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the expense..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Purchase Date</Text>
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowPurchasePicker(true)} activeOpacity={0.7}>
          <Feather name="calendar" size={16} color={colors.textSecondary} />
          <Text style={[styles.dateText, !purchaseDate && { color: colors.textLight }]}>
            {purchaseDate ? displayDate(purchaseDate) : 'Select date (optional)'}
          </Text>
          {purchaseDate && (
            <TouchableOpacity style={styles.dateClear} onPress={() => setPurchaseDate(null)}>
              <Feather name="x" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showPurchasePicker && (
          <DateTimePicker
            value={purchaseDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(_: DateTimePickerEvent, d?: Date) => {
              setShowPurchasePicker(Platform.OS === 'ios');
              if (d) setPurchaseDate(d);
            }}
          />
        )}

        <Text style={styles.label}>Expected Payment By</Text>
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowExpectPicker(true)} activeOpacity={0.7}>
          <Feather name="calendar" size={16} color={colors.textSecondary} />
          <Text style={[styles.dateText, !expectDate && { color: colors.textLight }]}>
            {expectDate ? displayDate(expectDate) : 'Select date (optional)'}
          </Text>
          {expectDate && (
            <TouchableOpacity style={styles.dateClear} onPress={() => setExpectDate(null)}>
              <Feather name="x" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {showExpectPicker && (
          <DateTimePicker
            value={expectDate ?? new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_: DateTimePickerEvent, d?: Date) => {
              setShowExpectPicker(Platform.OS === 'ios');
              if (d) setExpectDate(d);
            }}
          />
        )}

        <Text style={styles.label}>Attachments *</Text>
        {files.map((file, i) => (
          <View key={i} style={styles.fileCard}>
            <Feather name={fileIcon(file.mimeType)} size={20} color={colors.primary} />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              {file.size ? <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => removeFile(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x-circle" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={[styles.attachBtn, { marginTop: files.length > 0 ? spacing.sm : 0 }]} onPress={handlePickFiles} activeOpacity={0.7}>
          <Feather name="paperclip" size={16} color={colors.primary} />
          <Text style={styles.attachBtnText}>Add File</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>PDF, JPG or PNG · Max 10 MB each</Text>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="send" size={18} color="#fff" />
          )}
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Request'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
