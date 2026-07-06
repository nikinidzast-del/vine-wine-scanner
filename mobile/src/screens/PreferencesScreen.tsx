import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { updateUserPreferences } from '../services/firestoreService';
import { getFirebaseAuth } from '../services/auth';

const WINE_TYPES = ['red', 'white', 'rose', 'sparkling', 'any'] as const;

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function PreferencesScreen({ onComplete, onSkip }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSave = async () => {
    if (!selected) {
      onSkip();
      return;
    }

    setSaving(true);
    try {
      const auth = getFirebaseAuth();
      const fbUser = auth.currentUser;
      if (fbUser) {
        await updateUserPreferences(fbUser.uid, selected);
      }
    } catch (e) { console.warn('Failed to save preferences', e); }
    onComplete();
  };

  return (
    <ImageBackground
      source={require('../../assets/onboarding-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <BottleSilhouette opacity={0.05} size={260} style={styles.bgSilhouette} />

      <View style={styles.content}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <View style={styles.cardAccent} />

          <View style={styles.sealContainer}>
            <View style={styles.seal}>
              <Text style={styles.sealText}>V</Text>
            </View>
          </View>

          <Text style={styles.title}>{t('onboarding.preferences_title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.preferences_subtitle')}</Text>

          <View style={styles.goldLine} />

          <View style={styles.options}>
            {WINE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.option,
                  selected === type && styles.optionSelected,
                ]}
                onPress={() => setSelected(type)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selected === type && styles.optionTextSelected,
                  ]}
                >
                  {t(`onboarding.${type}`)}
                </Text>
                {selected === type && <View style={styles.optionCheck} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.continueButton, saving && styles.continueButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={saving}
          >
            <Text style={styles.continueText}>{t('common.continue')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  bgSilhouette: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 2,
  },
  card: {
    backgroundColor: 'rgba(16, 11, 11, 0.7)',
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 168, 76, 0.15)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gold,
    opacity: 0.3,
  },
  sealContainer: {
    marginBottom: spacing.md,
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  sealText: {
    fontSize: 26,
    fontFamily: fonts.serif.bold,
    color: colors.goldLight,
    lineHeight: 30,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.light || fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    opacity: 0.8,
    marginBottom: spacing.md,
  },
  goldLine: {
    width: 40,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.25,
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.md,
  },
  option: {
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
  },
  optionSelected: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.4)',
  },
  optionText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  optionTextSelected: {
    color: colors.goldLight,
  },
  optionCheck: {
    position: 'absolute',
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  skipButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
});
