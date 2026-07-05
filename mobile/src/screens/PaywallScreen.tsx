import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { getCurrencyConfig, formatPrice, formatMonthly } from '../utils/currency';
import type { CurrencyConfig } from '../utils/currency';

const { width } = Dimensions.get('window');

type PlanTier = 'weekly' | 'monthly' | 'yearly';

const planData = {
  weekly: { price: 3.99, monthly: null, savePercent: null },
  monthly: { price: 9.99, monthly: null, savePercent: null },
  yearly: { price: 49.99, monthly: 4.16, savePercent: 60 },
};

interface Props {
  onStartTrial: (tier: PlanTier) => void;
  onRestore: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  onClose?: () => void;
  loading?: boolean;
}

export function PaywallScreen({
  onStartTrial,
  onRestore,
  onTerms,
  onPrivacy,
  onClose,
  loading = false,
}: Props) {
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<PlanTier>('monthly');
  const [currency, setCurrency] = useState<CurrencyConfig>({ code: 'usd', symbol: '$', rate: 1 });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    getCurrencyConfig().then(setCurrency);
  }, []);

  const fmt = (usd: number) => formatPrice(usd, currency);

  const trialText =
    selectedTier === 'weekly'
      ? `3 days free, then ${fmt(planData.weekly.price)}/week`
      : selectedTier === 'monthly'
      ? `3 days free, then ${fmt(planData.monthly.price)}/month`
      : `3 days free, then ${fmt(planData.yearly.price)}/year`;

  const getYearlyMonthly = () => {
    if (selectedTier !== 'yearly') return null;
    return (
      <Text style={styles.yearlySub}>
        {formatMonthly(planData.yearly.monthly!, currency)}
      </Text>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/onboarding-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <BottleSilhouette opacity={0.04} size={340} style={styles.bgSilhouette1} />
      <BottleSilhouette opacity={0.025} size={200} style={styles.bgSilhouette2} />

      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.sealContainer}>
            <View style={styles.seal}>
              <Text style={styles.sealText}>V</Text>
            </View>
          </View>

          <Text style={styles.headline}>{t('paywall.headline')}</Text>
          <Text style={styles.subheadline}>{t('paywall.subheadline')}</Text>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDiamond} />
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.features}>
            {['feature_identify', 'feature_prices', 'feature_ratings', 'feature_save'].map(
              (feat) => (
                <View key={feat} style={styles.featureRow}>
                  <View style={styles.featureBullet} />
                  <Text style={styles.featureText}>{t(`paywall.${feat}`)}</Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.plansSection}>
          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedTier === 'weekly' && styles.planSelected,
              ]}
              onPress={() => setSelectedTier('weekly')}
              activeOpacity={0.7}
            >
              <View style={styles.planLeft}>
                <Text style={[styles.planLabel, selectedTier === 'weekly' && styles.planLabelSelected]}>
                  {t('paywall.weekly')}
                </Text>
                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, selectedTier === 'weekly' && styles.planPriceSelected]}>
                    {fmt(planData.weekly.price)}
                  </Text>
                  <Text style={[styles.planPeriod, selectedTier === 'weekly' && styles.planPeriodSelected]}>
                    /week
                  </Text>
                </View>
              </View>
              <View style={[styles.radioOuter, selectedTier === 'weekly' && styles.radioOuterSelected]}>
                {selectedTier === 'weekly' && <View style={styles.radioInner} />}
              </View>
              {selectedTier === 'weekly' && <View style={styles.planActiveGlow} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                styles.planFeatured,
                selectedTier === 'monthly' && styles.planSelected,
              ]}
              onPress={() => setSelectedTier('monthly')}
              activeOpacity={0.7}
            >
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText}>{t('paywall.most_popular')}</Text>
              </View>
              <View style={styles.planLeft}>
                <Text style={[styles.planLabel, selectedTier === 'monthly' && styles.planLabelSelected]}>
                  {t('paywall.monthly')}
                </Text>
                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, styles.planPriceFeatured, selectedTier === 'monthly' && styles.planPriceSelected]}>
                    {fmt(planData.monthly.price)}
                  </Text>
                  <Text style={[styles.planPeriod, selectedTier === 'monthly' && styles.planPeriodSelected]}>
                    /month
                  </Text>
                </View>
              </View>
              <View style={[styles.radioOuter, selectedTier === 'monthly' && styles.radioOuterSelected]}>
                {selectedTier === 'monthly' && <View style={styles.radioInner} />}
              </View>
              {selectedTier === 'monthly' && <View style={styles.planActiveGlow} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedTier === 'yearly' && styles.planSelected,
              ]}
              onPress={() => setSelectedTier('yearly')}
              activeOpacity={0.7}
            >
              <View style={styles.planLeft}>
                <View style={styles.planLabelRow}>
                  <Text style={[styles.planLabel, selectedTier === 'yearly' && styles.planLabelSelected]}>
                    {t('paywall.yearly')}
                  </Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>{t('paywall.save_percent')}</Text>
                  </View>
                </View>
                <View style={styles.planPriceRow}>
                  <Text style={[styles.planPrice, selectedTier === 'yearly' && styles.planPriceSelected]}>
                    {fmt(planData.yearly.price)}
                  </Text>
                  <Text style={[styles.planPeriod, selectedTier === 'yearly' && styles.planPeriodSelected]}>
                    /year
                  </Text>
                </View>
                {getYearlyMonthly()}
              </View>
              <View style={[styles.radioOuter, selectedTier === 'yearly' && styles.radioOuterSelected]}>
                {selectedTier === 'yearly' && <View style={styles.radioInner} />}
              </View>
              {selectedTier === 'yearly' && <View style={styles.planActiveGlow} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <View style={styles.trialContainer}>
            <Text style={styles.trialLabel}>START YOUR 3-DAY FREE TRIAL</Text>
            <Text style={styles.trialSub}>{trialText}</Text>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => onStartTrial(selectedTier)}
            activeOpacity={0.85}
            disabled={loading}
          >
            <View style={styles.ctaGradient}>
              <Text style={styles.ctaText}>{t('paywall.cta_trial')}</Text>
              <Text style={styles.ctaSub}>Cancel anytime</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRestore} style={styles.restoreButton}>
            <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
          </TouchableOpacity>

          <View style={styles.legal}>
            <TouchableOpacity onPress={onTerms}>
              <Text style={styles.legalText}>{t('paywall.terms')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSep}>✦</Text>
            <TouchableOpacity onPress={onPrivacy}>
              <Text style={styles.legalText}>{t('paywall.privacy')}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  bgSilhouette1: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
  },
  bgSilhouette2: {
    position: 'absolute',
    bottom: -30,
    right: -40,
    transform: [{ rotate: '15deg' }],
  },
  topGlow: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: width * 0.8,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -80,
    alignSelf: 'center',
    width: width * 0.6,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  headerSection: {
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  sealContainer: {
    marginBottom: spacing.lg,
  },
  seal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  sealText: {
    fontSize: 28,
    fontFamily: fonts.serif.bold,
    color: colors.goldLight,
    lineHeight: 32,
  },
  headline: {
    fontSize: 34,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 0.5,
  },
  subheadline: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.light || fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    width: 60,
    height: 0.5,
    backgroundColor: colors.gold,
    opacity: 0.4,
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    opacity: 0.6,
  },
  features: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureBullet: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  featureText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.text,
    letterSpacing: 0.3,
    opacity: 0.85,
  },
  plansSection: {
    marginTop: spacing.xl,
  },
  plansContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  planCard: {
    backgroundColor: 'rgba(16, 11, 11, 0.65)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: spacing.md,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  planFeatured: {
    borderColor: 'rgba(201, 168, 76, 0.4)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  planSelected: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
  },
  ribbon: {
    position: 'absolute',
    top: 12,
    right: -28,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  ribbonText: {
    fontSize: 8,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  planLeft: {
    flex: 1,
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planLabel: {
    fontSize: fontSizes.md,
    fontFamily: fonts.serif.bold,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  planLabelSelected: {
    color: colors.goldLight,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
    gap: 2,
  },
  planPrice: {
    fontSize: 30,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 0.5,
  },
  planPriceFeatured: {
    color: colors.goldLight,
  },
  planPriceSelected: {
    color: colors.goldLight,
  },
  planPeriod: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
  },
  planPeriodSelected: {
    color: colors.textSecondary,
  },
  yearlySub: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.gold,
    marginTop: spacing.xs,
  },
  saveBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  saveBadgeText: {
    fontSize: 9,
    fontFamily: fonts.sansSerif.bold,
    color: colors.goldLight,
    letterSpacing: 0.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.gold,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
  },
  planActiveGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.6,
  },
  ctaSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  trialContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trialLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.bold,
    color: colors.goldLight,
    letterSpacing: 2,
  },
  trialSub: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ctaButton: {
    width: '100%',
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  ctaGradient: {
    flex: 1,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.sansSerif.bold,
    color: colors.background,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ctaSub: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2,
  },
  restoreButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    letterSpacing: 0.5,
  },
  legal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  legalText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    opacity: 0.6,
  },
  legalSep: {
    color: colors.gold,
    fontSize: 8,
    opacity: 0.4,
  },
});
