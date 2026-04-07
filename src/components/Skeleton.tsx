import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width: number | string;
  height: number;
  radius?: number;
  style?: any;
}

export function Skeleton({ width, height, radius, style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const shimmerColors: [string, string, string] = isDark
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']
    : ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.02)', 'rgba(0,0,0,0.06)'];

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius ?? 6,
          backgroundColor: bg,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
