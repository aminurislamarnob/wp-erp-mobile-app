import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';

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
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
};

const COLOR_MAP: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#ECFDF5', border: '#10B981', icon: '#059669', text: '#065F46' },
  error: { bg: '#FEF2F2', border: '#EF4444', icon: '#DC2626', text: '#991B1B' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', icon: '#D97706', text: '#92400E' },
  info: { bg: '#EFF6FF', border: '#3B82F6', icon: '#2563EB', text: '#1E40AF' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef<(() => void) | undefined>(undefined);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToast(null);
      onDismissRef.current?.();
      onDismissRef.current = undefined;
    });
  }, [translateY, opacity]);

  const show = useCallback((config: ToastConfig) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onDismissRef.current = config.onDismiss;

    // Reset position
    translateY.setValue(-120);
    opacity.setValue(0);
    setToast(config);

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss
    const duration = config.duration ?? 3000;
    timeoutRef.current = setTimeout(dismiss, duration);
  }, [translateY, opacity, dismiss]);

  const success = useCallback((title: string, message?: string, onDismiss?: () => void) => {
    show({ type: 'success', title, message, onDismiss });
  }, [show]);

  const error = useCallback((title: string, message?: string) => {
    show({ type: 'error', title, message, duration: 4000 });
  }, [show]);

  const warning = useCallback((title: string, message?: string) => {
    show({ type: 'warning', title, message, duration: 4000 });
  }, [show]);

  const info = useCallback((title: string, message?: string) => {
    show({ type: 'info', title, message });
  }, [show]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const colorScheme = toast ? COLOR_MAP[toast.type] : COLOR_MAP.info;
  const iconName = toast ? ICON_MAP[toast.type] : 'info';

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            toastStyles.container,
            {
              transform: [{ translateY }],
              opacity,
              backgroundColor: colorScheme.bg,
              borderLeftColor: colorScheme.border,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={toastStyles.content}
            activeOpacity={0.9}
            onPress={dismiss}
          >
            <View style={[toastStyles.iconWrap, { backgroundColor: colorScheme.border + '20' }]}>
              <Feather name={iconName} size={22} color={colorScheme.icon} />
            </View>
            <View style={toastStyles.textWrap}>
              <Text style={[toastStyles.title, { color: colorScheme.text }]}>
                {toast.title}
              </Text>
              {toast.message ? (
                <Text style={[toastStyles.message, { color: colorScheme.text + 'CC' }]} numberOfLines={2}>
                  {toast.message}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={18} color={colorScheme.text + '80'} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 4,
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm + 1,
    fontWeight: '700',
  },
  message: {
    fontSize: fontSize.xs + 1,
    marginTop: 2,
    lineHeight: 18,
  },
});
