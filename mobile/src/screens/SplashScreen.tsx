import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing } from '../theme';
import { BottleSilhouette } from '../components/BottleSilhouette';

interface Props {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: Props) {
  const { t } = useTranslation();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const lineOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    scale.value = withSequence(
      withTiming(1.05, { duration: 400 }),
      withTiming(1, { duration: 200 })
    );
    lineOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    opacity: lineOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <BottleSilhouette opacity={0.15} size={250} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logo}>V</Text>
        <Text style={styles.title}>VINO</Text>
        <Animated.View style={[styles.accentLine, lineStyle]} />
        <Text style={styles.tagline}>{t('splash.tagline')}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 72,
    fontFamily: fonts.serif.bold,
    color: colors.accent,
    lineHeight: 80,
  },
  title: {
    fontSize: fontSizes.display,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 8,
    marginTop: -8,
  },
  accentLine: {
    width: 24,
    height: 1,
    backgroundColor: colors.gold,
    marginTop: spacing.md,
    opacity: 0.4,
  },
  tagline: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    marginTop: spacing.md,
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
});
