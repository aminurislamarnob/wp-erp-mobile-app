import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fontSize, spacing } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: () => void;
}

interface ToastContextValue {
  show: (config: ToastConfig) => void;
  success: (title: string, message?: string, onDismiss?: () => void) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICON_MAP: Record<ToastType, keyof typeof Feather.glyphMap> = {
  success: 'check',
  error:   'x',
  warning: 'alert-triangle',
  info:    'info',
};

const TYPE_COLORS: Record<ToastType, { iconBg: string; iconColor: string }> = {
  success: { iconBg: '#D1FAE5', iconColor: '#059669' },
  error:   { iconBg: '#FEE2E2', iconColor: '#DC2626' },
  warning: { iconBg: '#FEF3C7', iconColor: '#D97706' },
  info:    { iconBg: '#DBEAFE', iconColor: '#2563EB' },
};

// Inner component — has access to theme hook
function ToastDialog({
  toast,
  scaleAnim,
  translateYAnim,
  opacityAnim,
  onDismiss,
}: {
  toast: ToastConfig;
  scaleAnim: Animated.Value;
  translateYAnim: Animated.Value;
  opacityAnim: Animated.Value;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const scheme = TYPE_COLORS[toast.type];
  const iconName = ICON_MAP[toast.type];

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
            },
          ]}
        >
          {/* Icon badge */}
          <View style={[styles.iconCircle, { backgroundColor: scheme.iconBg }]}>
            <Feather name={iconName} size={32} color={scheme.iconColor} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{toast.title}</Text>

          {/* Message */}
          {toast.message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {toast.message}
            </Text>
          ) : null}

          {/* Ok button */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Ok</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const translateYAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef<(() => void) | undefined>(undefined);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 60, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setToast(null);
      onDismissRef.current?.();
      onDismissRef.current = undefined;
    });
  }, [scaleAnim, translateYAnim, opacityAnim]);

  const show = useCallback((config: ToastConfig) => {
    onDismissRef.current = config.onDismiss;
    scaleAnim.setValue(0.5);
    translateYAnim.setValue(80);
    opacityAnim.setValue(0);
    setToast(config);

    Animated.parallel([
      // Bouncy spring scale: overshoots to ~1.05 then settles at 1
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 180,
        friction: 6,
      }),
      // Slide up with bounce
      Animated.spring(translateYAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 180,
        friction: 6,
      }),
      // Quick fade in for the overlay
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, translateYAnim, opacityAnim]);

  const success = useCallback((title: string, message?: string, onDismiss?: () => void) => {
    show({ type: 'success', title, message, onDismiss });
  }, [show]);

  const error = useCallback((title: string, message?: string) => {
    show({ type: 'error', title, message });
  }, [show]);

  const warning = useCallback((title: string, message?: string) => {
    show({ type: 'warning', title, message });
  }, [show]);

  const info = useCallback((title: string, message?: string) => {
    show({ type: 'info', title, message });
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      {toast && (
        <ToastDialog
          toast={toast}
          scaleAnim={scaleAnim}
          translateYAnim={translateYAnim}
          opacityAnim={opacityAnim}
          onDismiss={dismiss}
        />
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.md + 1,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  btn: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl + spacing.lg,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
