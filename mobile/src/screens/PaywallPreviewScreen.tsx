import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { Button } from '../components/Button';
import { BottleSilhouette } from '../components/BottleSilhouette';

interface Props {
  onContinue: () => void;
  onUpgrade: () => void;
}

export function PaywallPreviewScreen({ onContinue, onUpgrade }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <BottleSilhouette opacity={0.07} size={260} style={styles.bgSilhouette} />

      <View style={styles.content}>
        <Text style={styles.badge}>PREMIUM</Text>
        <Text style={styles.title}>{t('onboarding.paywall_preview_title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.paywall_preview_subtitle')}</Text>

        <View style={styles.features}>
          {['feature_unlimited', 'feature_detailed', 'feature_history', 'feature_story'].map(
            (feat) => (
              <View key={feat} style={styles.featureRow}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkText}>✦</Text>
                </View>
                <Text style={styles.featureText}>{t(`paywall.${feat}`)}</Text>
              </View>
            )
          )}
        </View>

        <Button title={t('paywall.monthly_price')} onPress={onUpgrade} />

        <Button
          title={t('onboarding.continue_free')}
          onPress={onContinue}
          variant="ghost"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
    justifyContent: 'center',
  },
  bgSilhouette: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    zIndex: 2,
  },
  badge: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.bold,
    color: colors.accent,
    letterSpacing: 3,
    textAlign: 'center',
  },
  title: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  features: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.accent,
    fontSize: fontSizes.sm,
  },
  featureText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.text,
  },
});
