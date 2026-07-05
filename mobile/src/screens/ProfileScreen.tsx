import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { api } from '../services/api';
import { clearAuth } from '../services/auth';
import { restorePurchases } from '../services/billing';

interface Props {
  navigation: any;
}

interface User {
  email: string;
  subscriptionStatus: string;
  preferredWineType: string | null;
}

const WINE_TYPES = ['red', 'white', 'rose', 'sparkling', 'any'] as const;

export function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { user: data } = await api.auth.getMe();
      setUser(data);
    } catch (e) { console.error('Failed to load user', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), 'Are you sure?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('profile.delete_account'), t('profile.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.delete_account'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.auth.deleteAccount();
            await clearAuth();
            Alert.alert(t('common.done'), t('profile.account_deleted'));
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          } catch {
            Alert.alert(t('common.error'), 'Failed to delete account');
          }
        },
      },
    ]);
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert('Success', t('paywall.restore'));
        loadUser();
      } else {
        Alert.alert('No purchases', 'No previous purchases found');
      }
    } catch {
      Alert.alert(t('common.error'), 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handlePreferenceChange = async (type: string) => {
    try {
      await api.user.updatePreferences(type);
      setUser((prev) => (prev ? { ...prev, preferredWineType: type } : prev));
    } catch (e) { console.warn('Failed to update preference', e); }
  };

  const isPremium = user?.subscriptionStatus === 'premium';

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      contentContainerStyle={styles.scrollContent}
    >
      <BottleSilhouette opacity={0.03} size={240} style={styles.bgSilhouette} />

      <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.settingsIcon}>⋯</Text>
      </TouchableOpacity>

      <View style={styles.heroSection}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarRing, isPremium && styles.avatarRingPremium]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user ? (user.email?.[0] || '?').toUpperCase() : 'V'}
              </Text>
            </View>
          </View>
          {isPremium && (
            <View style={styles.premiumDot}>
              <Text style={styles.premiumDotText}>✦</Text>
            </View>
          )}
        </View>
        {user && (
          <Text style={styles.email}>{user.email}</Text>
        )}
        <View style={styles.subscriptionRow}>
          <View style={[styles.subBadge, isPremium && styles.subBadgePremium]}>
            <View style={[styles.subDot, isPremium && styles.subDotPremium]} />
            <Text style={[styles.subText, isPremium && styles.subTextPremium]}>
              {isPremium ? t('profile.premium') : t('profile.free')}
            </Text>
          </View>
        </View>
        {!isPremium && user && (
          <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('Paywall')}>
            <Text style={styles.upgradeText}>{t('profile.upgrade')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDiamond} />
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('profile.preferences')}</Text>
        <View style={styles.wineTypes}>
          {WINE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.wineChip,
                user?.preferredWineType === type && styles.wineChipActive,
              ]}
              onPress={() => handlePreferenceChange(type)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.wineChipText,
                user?.preferredWineType === type && styles.wineChipTextActive,
              ]}>
                {t(`onboarding.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.dividerLight} />

      <TouchableOpacity style={styles.menuItem} onPress={handleRestore} disabled={restoring}>
        <Text style={styles.menuItemText}>{restoring ? t('common.loading') : t('profile.restore_purchases')}</Text>
        <Text style={styles.menuArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.dividerLight} />

      <View style={styles.footerSection}>
        <TouchableOpacity onPress={handleLogout} style={styles.footerLink}>
          <Text style={styles.footerLinkText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteAccount} style={styles.footerLink}>
          <Text style={styles.footerLinkDanger}>{t('profile.delete_account')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge,
  },
  bgSilhouette: {
    position: 'absolute',
    top: 80,
    right: -60,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
    color: colors.textMuted,
  },
  heroSection: {
    paddingTop: 120,
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingPremium: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.gold,
  },
  premiumDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumDotText: {
    fontSize: 9,
    color: '#0A0808',
  },
  email: {
    fontSize: fontSizes.md,
    fontFamily: fonts.sansSerif.medium,
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  subscriptionRow: {
    alignItems: 'center',
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  subBadgePremium: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  subDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textMuted,
  },
  subDotPremium: {
    backgroundColor: colors.gold,
  },
  subText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  subTextPremium: {
    color: colors.gold,
  },
  upgradeButton: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    backgroundColor: 'rgba(201, 168, 76, 0.05)',
  },
  upgradeText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.semibold,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
  },
  dividerDiamond: {
    width: 5,
    height: 5,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.md,
    opacity: 0.3,
  },
  dividerLight: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  wineTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  wineChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  wineChipActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.08)',
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  wineChipText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.medium,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  wineChipTextActive: {
    color: colors.gold,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
  },
  menuItemText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  menuArrow: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    opacity: 0.4,
  },
  footerSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  footerLink: {
    paddingVertical: spacing.sm,
  },
  footerLinkText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
    letterSpacing: 1,
    opacity: 0.6,
  },
  footerLinkDanger: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: 'rgba(255,68,68,0.5)',
    letterSpacing: 1,
  },
});
