import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { changeLanguage, languageOptions } from '../i18n';
import { getStoredToken } from '../services/auth';

const CURRENCY_KEY = '@vino_currency';

const langToCurrency: Record<string, string> = {
  en: 'usd',
  sr: 'rsd',
  it: 'eur',
  fr: 'eur',
};

const currencyOptions = [
  { code: 'usd', label: 'settings.usd' },
  { code: 'eur', label: 'settings.eur' },
  { code: 'rsd', label: 'settings.rsd' },
];

interface Props {
  navigation: any;
}

export function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState('usd');

  useEffect(() => {
    checkAuth();
    loadCurrency();
  }, []);

  const checkAuth = async () => {
    const token = await getStoredToken();
    setIsSignedIn(!!token);
  };

  const loadCurrency = async () => {
    try {
      const stored = await AsyncStorage.getItem(CURRENCY_KEY);
      if (stored) setCurrentCurrency(stored);
    } catch (e) { console.warn('Failed to load currency', e); }
  };

  const handleChangeLanguage = async (code: string) => {
    if (code !== currentLang) {
      await changeLanguage(code);
      const currency = langToCurrency[code] || 'usd';
      setCurrentCurrency(currency);
      try {
        await AsyncStorage.setItem(CURRENCY_KEY, currency);
      } catch (e) { console.warn('Failed to save currency', e); }
    }
  };

  const handleChangeCurrency = async (code: string) => {
    setCurrentCurrency(code);
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, code);
    } catch (e) { console.warn('Failed to save currency', e); }
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

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'usd': return '$';
      case 'eur': return '€';
      case 'rsd': return 'дин';
      default: return '$';
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/onboarding-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <BottleSilhouette opacity={0.04} size={260} style={styles.bgSilhouette} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{t('settings.title')}</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {!isSignedIn && (
          <TouchableOpacity
            style={styles.authCard}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.7}
          >
            <View style={styles.authCardContent}>
              <View style={styles.authIcon}>
                <Text style={styles.authIconText}>V</Text>
              </View>
              <View style={styles.authTextGroup}>
                <Text style={styles.authTitle}>{t('settings.sign_in')}</Text>
                <Text style={styles.authDesc}>{t('settings.sign_in_desc')}</Text>
              </View>
              <Text style={styles.authArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <View style={styles.goldLine} />
          <View style={styles.options}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                style={[
                  styles.option,
                  currentLang === opt.code && styles.optionSelected,
                ]}
                onPress={() => handleChangeLanguage(opt.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{getFlag(opt.code)}</Text>
                <View style={styles.optionTextGroup}>
                  <Text style={[styles.optionNative, currentLang === opt.code && styles.optionTextSelected]}>
                    {opt.native}
                  </Text>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </View>
                {currentLang === opt.code && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.sectionLabel}>{t('settings.currency')}</Text>
          <View style={styles.goldLine} />
          <View style={styles.options}>
            {currencyOptions.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                style={[
                  styles.option,
                  currentCurrency === opt.code && styles.optionSelected,
                ]}
                onPress={() => handleChangeCurrency(opt.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.currencySymbol}>{getCurrencySymbol(opt.code)}</Text>
                <View style={styles.optionTextGroup}>
                  <Text style={[styles.optionNative, currentCurrency === opt.code && styles.optionTextSelected]}>
                    {t(opt.label)}
                  </Text>
                </View>
                {currentCurrency === opt.code && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.sectionLabel}>{t('settings.legal')}</Text>
          <View style={styles.goldLine} />
          <View style={styles.legalOptions}>
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => Linking.openURL('https://vino-scanner-api.vercel.app/terms')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalText}>{t('settings.terms_of_service')}</Text>
              <Text style={styles.legalArrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.legalDivider} />
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => Linking.openURL('https://vino-scanner-api.vercel.app/privacy')}
              activeOpacity={0.7}
            >
              <Text style={styles.legalText}>{t('settings.privacy_policy')}</Text>
              <Text style={styles.legalArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    top: -30,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.md,
    zIndex: 5,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textSecondary,
    letterSpacing: 1,
    opacity: 0.7,
  },
  screenTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 0.5,
  },
  backPlaceholder: {
    width: 60,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  authCard: {
    backgroundColor: 'rgba(16, 11, 11, 0.7)',
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 168, 76, 0.2)',
    padding: spacing.lg,
  },
  authCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  authIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  authIconText: {
    fontSize: 20,
    fontFamily: fonts.serif.bold,
    color: colors.goldLight,
  },
  authTextGroup: {
    flex: 1,
  },
  authTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.serif.bold,
    color: colors.text,
  },
  authDesc: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  authArrow: {
    fontSize: fontSizes.xl,
    color: colors.gold,
    opacity: 0.6,
  },
  card: {
    backgroundColor: 'rgba(16, 11, 11, 0.7)',
    borderRadius: borderRadius.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(201, 168, 76, 0.15)',
    padding: spacing.xl,
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
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.bold,
    color: colors.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  goldLine: {
    width: 30,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.25,
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.md,
  },
  optionSelected: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.35)',
  },
  flag: {
    fontSize: 22,
  },
  currencySymbol: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.textSecondary,
    width: 28,
    textAlign: 'center',
  },
  optionTextGroup: {
    flex: 1,
  },
  optionNative: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.medium,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.goldLight,
  },
  optionLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontSize: 12,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
  },
  legalOptions: {
    gap: 0,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  legalText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textSecondary,
  },
  legalArrow: {
    fontSize: fontSizes.lg,
    color: colors.gold,
    opacity: 0.4,
  },
  legalDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
