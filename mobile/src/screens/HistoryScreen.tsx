import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, fontSizes, spacing, borderRadius } from '../theme';
import { FrostedCard } from '../components/FrostedCard';
import { BottleSilhouette } from '../components/BottleSilhouette';
import { getScans } from '../services/firestoreService';
import { getFirebaseAuth } from '../services/auth';
import { WineScan } from '../types';

export function HistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [scans, setScans] = useState<WineScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (pageNum = 1, isRefresh = false) => {
    try {
      const auth = getFirebaseAuth();
      const fbUser = auth.currentUser;
      if (!fbUser) return;
      const result = await getScans(fbUser.uid, pageNum);
      if (pageNum === 1) {
        setScans(result.scans as any);
      } else {
        setScans((prev) => [...prev, ...result.scans as any]);
      }
      setTotalPages(result.hasMore ? pageNum + 1 : pageNum);
      setPage(pageNum);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory(1, true);
  }, []);

  const loadMore = () => {
    if (page < totalPages && !loading) {
      loadHistory(page + 1);
    }
  };

  const filteredScans = search
    ? scans.filter(
        (s) =>
          s.wineName?.toLowerCase().includes(search.toLowerCase()) ||
          s.producer?.toLowerCase().includes(search.toLowerCase()) ||
          s.region?.toLowerCase().includes(search.toLowerCase())
      )
    : scans;

  const renderItem = ({ item }: { item: WineScan }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('WineDetail', { scanId: item.id })}
      activeOpacity={0.7}
    >
      <FrostedCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            {item.wineName && (
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.wineName}
              </Text>
            )}
            {item.producer && (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item.producer}
              </Text>
            )}
            <View style={styles.cardMeta}>
              {item.vintage && (
                <Text style={styles.metaText}>{item.vintage}</Text>
              )}
              {item.region && (
                <Text style={styles.metaText}> — {item.region}</Text>
              )}
            </View>
          </View>
          {item.priceRange && (
            <Text style={styles.priceText}>{item.priceRange}</Text>
          )}
        </View>
      </FrostedCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
      <View style={styles.container}>
        <BottleSilhouette opacity={0.04} size={240} style={styles.bgSilhouette} />

      <View style={styles.header}>
          <Text style={styles.screenTitle}>{t('history.title')}</Text>
          <View style={styles.headerAccent} />
        </View>

      <TextInput
        style={styles.searchInput}
        placeholder={t('history.search_placeholder')}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {filteredScans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>❖</Text>
          </View>
          <Text style={styles.emptyTitle}>{t('history.empty_title')}</Text>
          <Text style={styles.emptySubtitle}>{t('history.empty_subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredScans}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0808',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0808',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgSilhouette: {
    position: 'absolute',
    top: -40,
    right: -60,
    opacity: 0.04,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  screenTitle: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    letterSpacing: 2,
  },
  headerAccent: {
    width: 24,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.5,
  },
  searchInput: {
    height: 40,
    backgroundColor: 'rgba(26,26,26,0.8)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xs,
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontFamily: fonts.serif.bold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  metaText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textMuted,
  },
  priceText: {
    fontSize: fontSizes.md,
    fontFamily: fonts.serif.bold,
    color: colors.gold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.serif.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansSerif.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});
