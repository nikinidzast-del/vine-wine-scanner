import { Platform } from 'react-native';
import { updatePremiumStatus } from './firestoreService';
import { getFirebaseAuth } from './auth';

const PRODUCTS = Platform.select({
  android: {
    monthly: 'wine_premium_monthly',
    yearly: 'wine_premium_yearly',
    credits10: 'scan_credits_10',
  },
  ios: {
    monthly: 'wine_premium_monthly',
    yearly: 'wine_premium_yearly',
    credits10: 'scan_credits_10',
  },
  default: {
    monthly: 'wine_premium_monthly',
    yearly: 'wine_premium_yearly',
    credits10: 'scan_credits_10',
  },
});

export type SubscriptionTier = 'monthly' | 'yearly';

const isAndroid = Platform.OS === 'android';

async function setPremium() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (user) {
    try { await updatePremiumStatus(user.uid, true); } catch {}
  }
}

export async function purchaseSubscription(tier: SubscriptionTier): Promise<boolean> {
  if (__DEV__) {
    await setPremium();
    return true;
  }

  try {
    const RNIap = await import('react-native-iap');
    const productId = PRODUCTS[tier];

    const purchase = await RNIap.requestPurchase({
      request: {
        ...(isAndroid ? { google: { skus: [productId] } } : { apple: { sku: productId } }),
      },
      type: 'subs',
    });

    if (purchase) {
      await RNIap.finishTransaction({
        purchase: Array.isArray(purchase) ? purchase[0] : purchase,
        isConsumable: false,
      });
    }

    await setPremium();
    return true;
  } catch (error: any) {
    if (error?.code === 'E_USER_CANCELLED' || error?.code === 'USER_CANCELLED') {
      return false;
    }
    console.error('Purchase failed:', error);
    throw error;
  }
}

export async function purchaseCredits(): Promise<boolean> {
  if (__DEV__) return true;

  try {
    const RNIap = await import('react-native-iap');
    const productId = PRODUCTS.credits10;

    const purchase = await RNIap.requestPurchase({
      request: {
        ...(isAndroid ? { google: { skus: [productId] } } : { apple: { sku: productId } }),
      },
      type: 'in-app',
    });

    if (purchase) {
      await RNIap.finishTransaction({
        purchase: Array.isArray(purchase) ? purchase[0] : purchase,
        isConsumable: true,
      });
    }

    return true;
  } catch (error: any) {
    if (error?.code === 'E_USER_CANCELLED' || error?.code === 'USER_CANCELLED') {
      return false;
    }
    console.error('Credits purchase failed:', error);
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (__DEV__) return true;

  try {
    const RNIap = await import('react-native-iap');

    await RNIap.restorePurchases();

    return true;
  } catch (error) {
    console.error('Restore purchases failed:', error);
    return false;
  }
}

export { PRODUCTS };
