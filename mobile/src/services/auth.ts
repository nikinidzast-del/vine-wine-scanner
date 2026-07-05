import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, api } from './api';

const ONBOARDING_KEY = '@vino_onboarding_complete';
const AUTH_TOKEN_KEY = '@vino_auth_token';

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  try {
    await api.auth.markOnboarded();
  } catch (e) { console.warn('Failed to mark onboarding on server', e); }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function storeToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  setAuthToken(token);
}

export async function clearAuth() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(ONBOARDING_KEY);
  setAuthToken(null);
}

export async function handleFirebaseLogin(idToken: string) {
  await storeToken(idToken);
  const { user } = await api.auth.firebaseLogin(idToken);
  return user;
}
