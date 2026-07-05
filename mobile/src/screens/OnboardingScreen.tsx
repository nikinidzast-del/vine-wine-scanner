import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { changeLanguage, languageOptions } from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENCY_KEY = '@vino_currency';

const langToCurrency: Record<string, string> = {
  en: 'usd',
  sr: 'rsd',
  it: 'eur',
  fr: 'eur',
};

const { height } = Dimensions.get('window');

interface OnboardingPage {
  key: string;
  title: string;
  subtitle: string;
}

interface Props {
  onComplete: () => void;
  onSkip: () => void;
  onGuestContinue: () => void;
  onGoogleSignIn: () => void;
}

const pages: OnboardingPage[] = [
  {
    key: 'welcome',
    title: 'onboarding.welcome_title',
    subtitle: 'onboarding.welcome_subtitle',
  },
  {
    key: 'ai',
    title: 'onboarding.ai_title',
    subtitle: 'onboarding.ai_subtitle',
  },
  {
    key: 'cellar',
    title: 'onboarding.cellar_title',
    subtitle: 'onboarding.cellar_subtitle',
  },
  {
    key: 'auth',
    title: 'onboarding.auth_headline',
    subtitle: 'onboarding.auth_sub',
  },
];

export function OnboardingScreen({ onComplete, onSkip, onGuestContinue, onGoogleSignIn }: Props) {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState(i18n.language);

  const totalScreens = pages.length + 1;
  const isLanguagePage = currentIndex === 1;
  const isLastPage = currentIndex === totalScreens - 1;
  const page = isLanguagePage || isLastPage ? null : pages[currentIndex];

  const handleNext = () => {
    if (currentIndex < totalScreens - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleSelectLanguage = async (code: string) => {
    if (code !== selectedLang) {
      setSelectedLang(code);
      await changeLanguage(code);
      const currency = langToCurrency[code] || 'usd';
      try {
        await AsyncStorage.setItem(CURRENCY_KEY, currency);
      } catch {}
    }
  };

  const getFlag = (code: string) => {
    switch (code) {
      case 'en': return '🇬🇧';
      case 'sr': return '🇷🇸';
      case 'it': return '🇮🇹';
      case 'fr': return '🇫🇷';
      default: return '🌐';
    }
  };

  const renderLanguagePage = () => (
    <View style={styles.page}>
      <View style={styles.pageContent}>
        <View style={styles.langCard}>
          <View style={styles.langCardAccent} />
          <Text style={styles.langTitle}>{t('onboarding.lang_title')}</Text>
          <View style={styles.goldLine} />
          <View style={styles.langOptions}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                style={[
                  styles.langOption,
                  selectedLang === opt.code && styles.langOptionSelected,
                ]}
                onPress={() => handleSelectLanguage(opt.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{getFlag(opt.code)}</Text>
                <View style={styles.langOptionTextGroup}>
                  <Text style={[styles.langOptionNative, selectedLang === opt.code && styles.langOptionTextSelected]}>
                    {opt.native}
                  </Text>
                  <Text style={styles.langOptionSub}>{opt.label}</Text>
                </View>
                {selectedLang === opt.code && (
                  <View style={styles.langCheckmark}>
                    <Text style={styles.langCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/onboarding-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <BottleSilhouette opacity={0.06} size={300} style={styles.bgSilhouette} />

      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandLetter}>V</Text>
          <Text style={styles.brandName}>VINO</Text>
        </View>
        <View style={styles.skipContainer}>
          {!isLanguagePage && !isLastPage && (
            <TouchableOpacity onPress={onSkip}>
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.goldLineTop} />

      {isLanguagePage ? (
        renderLanguagePage()
      ) : isLastPage ? (
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <View style={styles.textCard}>
              <View style={styles.cardAccent} />
              <Text style={styles.pageTitle}>{t(pages[3].title)}</Text>
              <Text style={styles.pageSubtitle}>{t(pages[3].subtitle)}</Text>
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={onGoogleSignIn}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>{t('onboarding.google_signin')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onGuestContinue} style={styles.guestButton}>
                  <View style={styles.guestDividerLine} />
                  <Text style={styles.guestText}>{t('onboarding.guest_continue')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.page}>
          <View style={styles.pageContent}>
            <View style={styles.textCard}>
              <View style={styles.cardAccent} />
              <Text style={styles.pageTitle}>{t(page!.title)}</Text>
              <Text style={styles.pageSubtitle}>{t(page!.subtitle)}</Text>
            </View>
          </View>
        </View>
      )}

      {!isLastPage && (
        <View style={styles.footer}>
          {!isLanguagePage && currentIndex > 0 && (
            <View style={styles.dots}>
              {pages.slice(0, -1).map((_, i) => {
                const adjustedIndex = i < 1 ? i : i + 1;
                return (
                  <View
                    key={i}
                    style={[styles.dot, adjustedIndex === currentIndex && styles.dotActive]}
                  />
                );
              })}
            </View>
          )}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bgSilhouette: {
    position: 'absolute',
    top: height * 0.12,
    alignSelf: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandLetter: {
    fontSize: 44,
    fontFamily: fonts.serif.bold,
    color: colors.gold,
    lineHeight: 48,
    letterSpacing: 2,
  },
  brandName: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 14,
    marginTop: -6,
  },
  skipContainer: {
    marginTop: 12,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  goldLineTop: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    width: 40,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.3,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pageContent: {
    alignItems: 'center',
    zIndex: 2,
    marginTop: 60,
    width: '100%',
  },
  langCard: {
    backgroundColor: 'rgba(16, 11, 11, 0.75)',
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 168, 76, 0.2)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    position: 'relative',
    overflow: 'hidden',
  },
  langCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.gold,
    opacity: 0.35,
  },
  langTitle: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  goldLine: {
    width: 30,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.25,
    marginBottom: spacing.lg,
  },
  langOptions: {
    width: '100%',
    gap: spacing.sm,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.md,
  },
  langOptionSelected: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.35)',
  },
  flag: {
    fontSize: 24,
  },
  langOptionTextGroup: {
    flex: 1,
  },
  langOptionNative: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.medium,
    color: colors.text,
  },
  langOptionTextSelected: {
    color: colors.goldLight,
  },
  langOptionSub: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  langCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCheckmarkText: {
    fontSize: 12,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
  },
  textCard: {
    backgroundColor: 'rgba(16, 11, 11, 0.7)',
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 168, 76, 0.15)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
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
  pageTitle: {
    fontSize: fontSizes.xxxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 44,
    letterSpacing: 1,
  },
  pageSubtitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.light || fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: spacing.sm,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    backgroundColor: colors.gold,
    width: 24,
    borderRadius: borderRadius.full,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  authButtons: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  googleButton: {
    width: '100%',
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 12,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
    lineHeight: 14,
  },
  googleButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    color: colors.text,
    letterSpacing: 1,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  guestDividerLine: {
    width: '40%',
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  guestText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
