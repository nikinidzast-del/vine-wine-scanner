import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, StyleSheet, Linking, Alert } from 'react-native';
import { colors, fonts } from '../theme';
import { isOnboardingComplete, setOnboardingComplete, onAuthChange, getFirebaseAuth } from '../services/auth';
import { ensureUserDoc, getUser, updatePremiumStatus } from '../services/firestoreService';
import { purchaseSubscription, restorePurchases } from '../services/billing';
import type { UserData } from '../services/firestoreService';

import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { PreferencesScreen } from '../screens/PreferencesScreen';
import { PaywallPreviewScreen } from '../screens/PaywallPreviewScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ScanResultScreen } from '../screens/ScanResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { WineDetailScreen } from '../screens/WineDetailScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { deleteUser } from 'firebase/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

type AppState = 'loading' | 'splash' | 'onboarding' | 'auth' | 'postAuth' | 'paywall' | 'main';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 8, 8, 0.98)',
          borderTopColor: 'rgba(201, 168, 76, 0.08)',
          borderTopWidth: 0.5,
          paddingBottom: 28,
          paddingTop: 12,
          height: 80,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.2)',
        tabBarLabelStyle: {
          fontFamily: fonts.sansSerif.medium,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginTop: 6,
        },
        tabBarItemStyle: {
          position: 'relative',
        },
        tabBarIndicatorStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <View style={[styles.scanIcon, { borderColor: focused ? colors.gold : 'rgba(255,255,255,0.15)' }]}>
                <View style={[styles.scanIconInner, { backgroundColor: focused ? colors.gold : 'transparent' }]} />
              </View>
              {focused && <View style={styles.tabActiveDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Cellar',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Text style={[styles.tabIconText, { color: focused ? colors.gold : 'rgba(255,255,255,0.15)' }]}>❖</Text>
              {focused && <View style={styles.tabActiveDot} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <View style={[styles.profileIcon, { borderColor: focused ? colors.gold : 'rgba(255,255,255,0.15)' }]}>
                <Text style={[styles.profileIconText, { color: focused ? colors.gold : 'rgba(255,255,255,0.15)' }]}>V</Text>
              </View>
              {focused && <View style={styles.tabActiveDot} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.gold,
    background: '#0A0808',
    card: '#0A0808',
    text: colors.text,
    border: 'rgba(255,255,255,0.06)',
    notification: colors.gold,
  },
};

export function AppNavigator() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [user, setUser] = useState<UserData | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const bootstrapped = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (bootstrapped.current) return;
      bootstrapped.current = true;
      if (firebaseUser) {
        try {
          await ensureUserDoc(firebaseUser.uid, firebaseUser.email || '');
          const userData = await getUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            if (!userData.onboarded) {
              await setOnboardingComplete();
            }
          }
          setAppState('main');
        } catch {
          setAppState('auth');
        }
      } else {
        const onboarded = await isOnboardingComplete();
        setAppState(onboarded ? 'auth' : 'splash');
      }
    });
    return unsubscribe;
  }, []);

  const handleSplashComplete = async () => {
    const onboarded = await isOnboardingComplete();
    setAppState(onboarded ? 'auth' : 'onboarding');
  };

  const handleOnboardingComplete = () => {
    setAppState('auth');
  };

  const handleOnboardingSkip = () => {
    setAppState('paywall');
  };

  const handleGuestContinue = () => {
    setAppState('paywall');
  };

  const handleGoogleSignIn = () => {
    setAppState('auth');
  };

  const handleAuthSuccess = async () => {
    const fbUser = getFirebaseAuth().currentUser;
    if (fbUser) {
      try {
        await ensureUserDoc(fbUser.uid, fbUser.email || '');
        const userData = await getUser(fbUser.uid);
        if (userData) setUser(userData);
      } catch {}
    }
    setAppState('paywall');
  };

  const handleAuthBack = () => {
    setAppState('onboarding');
  };

  const handlePreferencesComplete = () => {
    setAppState('main');
  };

  const handleStartTrial = async (tier: string) => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const success = await purchaseSubscription(tier as 'monthly' | 'yearly');
      if (success) {
        setAppState('postAuth');
      }
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message || 'An error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Restored', 'Your purchases have been restored');
      setAppState('main');
    }
  };

  const handleTerms = () => {
    Linking.openURL('https://vino-scanner-api.vercel.app/terms');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://vino-scanner-api.vercel.app/privacy');
  };

  const handleUpgrade = async () => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const success = await purchaseSubscription('monthly');
      if (success) {
        Alert.alert('Welcome to Premium', 'Thank you for your purchase');
      }
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message || 'An error occurred');
    } finally {
      setPurchasing(false);
    }
  };

  if (appState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (appState === 'paywall') {
    return (
      <>
        <StatusBar style="light" />
        <PaywallScreen
          onStartTrial={handleStartTrial}
          onRestore={handleRestore}
          onTerms={handleTerms}
          onPrivacy={handlePrivacy}
          loading={purchasing}
        />
      </>
    );
  }

  if (appState === 'postAuth') {
    return (
      <>
        <StatusBar style="light" />
        <PreferencesScreen
          onComplete={handlePreferencesComplete}
          onSkip={handlePreferencesComplete}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0A0808' } }}>
          {appState === 'splash' && (
            <Stack.Screen name="Splash">
              {() => <SplashScreen onComplete={handleSplashComplete} />}
            </Stack.Screen>
          )}

          {appState === 'onboarding' && (
            <Stack.Screen name="Onboarding">
              {() => (
                <OnboardingScreen
                  onComplete={handleOnboardingComplete}
                  onSkip={handleOnboardingSkip}
                  onGuestContinue={handleGuestContinue}
                  onGoogleSignIn={handleGoogleSignIn}
                />
              )}
            </Stack.Screen>
          )}

          {appState === 'auth' && (
            <Stack.Screen name="Auth">
              {() => (
                <AuthScreen
                  onAuthSuccess={handleAuthSuccess}
                  onBack={handleAuthBack}
                  onGuestContinue={handleGuestContinue}
                />
              )}
            </Stack.Screen>
          )}

          {appState === 'main' && (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="ScanResult"
                component={ScanResultScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="WineDetail"
                component={WineDetailScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen name="Paywall">
                {({ navigation: nav }) => (
                  <PaywallScreen
                    onStartTrial={handleStartTrial}
                    onRestore={handleRestore}
                    onTerms={handleTerms}
                    onPrivacy={handlePrivacy}
                    onClose={() => nav.goBack()}
                    loading={purchasing}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen name="Auth">
                {({ navigation: nav }) => (
                  <AuthScreen
                    onAuthSuccess={() => nav.reset({ index: 0, routes: [{ name: 'Main' }] })}
                    onBack={() => nav.goBack()}
                    onGuestContinue={() => nav.goBack()}
                  />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0808',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconActive: {
    backgroundColor: 'rgba(201, 168, 76, 0.06)',
  },
  tabActiveDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  scanIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabIconText: {
    fontSize: 18,
  },
  profileIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconText: {
    fontSize: 11,
    fontFamily: fonts.serif.bold,
  },
});
