import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { FrostedCard } from '../components/FrostedCard';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { api } from '../services/api';

interface WineScan {
  id: string;
  wineName: string | null;
  producer: string | null;
  vintage: string | null;
  grapeVariety: string | null;
  region: string | null;
  abv: string | null;
  priceRange: string | null;
  priceConfidence: string | null;
  reviewSummary: string | null;
  wineryStory: string | null;
  createdAt: string;
}

export function WineDetailScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { scanId } = route.params;
  const [scan, setScan] = useState<WineScan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScan();
  }, [scanId]);

  const loadScan = async () => {
    try {
      const { scan: data } = await api.scan.getById(scanId);
      setScan(data);
    } catch {
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!scan) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <BottleSilhouette opacity={0.04} size={200} style={styles.bgSilhouette} />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.heroAccentLine} />
          {scan.wineName && (
            <Text style={styles.wineName}>{scan.wineName}</Text>
          )}
          {scan.producer && (
            <Text style={styles.producer}>{scan.producer}</Text>
          )}
          {scan.vintage && (
            <View style={styles.vintageBadge}>
              <Text style={styles.vintageText}>{scan.vintage}</Text>
            </View>
          )}
          {scan.createdAt && (
            <Text style={styles.date}>{t('result.scanned_on')} {new Date(scan.createdAt).toLocaleDateString()}</Text>
          )}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDiamond} />
          <View style={styles.dividerLine} />
        </View>

        <FrostedCard style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>DETAILS</Text>
          <View style={styles.detailGrid}>
            {scan.vintage && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('result.vintage')}</Text>
                <Text style={styles.detailValue}>{scan.vintage}</Text>
              </View>
            )}
            {scan.grapeVariety && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('result.grape_variety')}</Text>
                <Text style={styles.detailValue}>{scan.grapeVariety}</Text>
              </View>
            )}
            {scan.region && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('result.region')}</Text>
                <Text style={styles.detailValue}>{scan.region}</Text>
              </View>
            )}
            {scan.abv && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('result.alcohol')}</Text>
                <Text style={styles.detailValue}>{scan.abv}</Text>
              </View>
            )}
          </View>
        </FrostedCard>

        {scan.priceRange && (
          <FrostedCard style={styles.priceCard}>
            <View style={styles.priceGlow} />
            <Text style={styles.sectionTitleGold}>{t('result.price_range')}</Text>
            <Text style={styles.priceText}>{scan.priceRange}</Text>
          </FrostedCard>
        )}

        {scan.reviewSummary && (
          <FrostedCard style={styles.section}>
            <Text style={styles.sectionTitle}>{t('result.review_summary')}</Text>
            <Text style={styles.bodyText}>{scan.reviewSummary}</Text>
          </FrostedCard>
        )}

        {scan.wineryStory && (
          <FrostedCard style={styles.section}>
            <Text style={styles.sectionTitle}>{t('result.winery_story')}</Text>
            <Text style={styles.bodyText}>{scan.wineryStory}</Text>
          </FrostedCard>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0808',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgSilhouette: {
    position: 'absolute',
    top: 80,
    right: -40,
  },
  backButton: {
    position: 'absolute',
    top: 54,
    left: spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: colors.gold,
    fontSize: 22,
    fontFamily: fonts.sansSerif.regular,
  },
  heroSection: {
    paddingTop: 110,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroAccentLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  wineName: {
    fontSize: fontSizes.xxxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(201, 168, 76, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  producer: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.sansSerif.medium,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  vintageBadge: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  vintageText: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.gold,
    letterSpacing: 3,
  },
  date: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
    marginTop: spacing.md,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(201, 168, 76, 0.15)',
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.md,
    opacity: 0.4,
  },
  detailsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  sectionTitleGold: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.bold,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  detailValue: {
    fontSize: fontSizes.md,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  priceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderColor: 'rgba(201, 168, 76, 0.15)',
    borderWidth: 0.5,
    position: 'relative',
    overflow: 'hidden',
  },
  priceGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(201, 168, 76, 0.04)',
  },
  priceText: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.gold,
    letterSpacing: 1,
  },
  bodyText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  footer: {
    height: spacing.xxl,
  },
});
