import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function FrostedCard({ children, style, intensity = 40 }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.overlay, { opacity: intensity / 100 }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    position: 'relative',
    zIndex: 2,
  },
});
