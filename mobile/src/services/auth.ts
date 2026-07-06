import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { initializeAuth } from './firebase';
import { ensureUserDoc } from './firestoreService';

const ONBOARDING_KEY = '@vino_onboarding_complete';

const app = initializeAuth();
const auth = getAuth(app);

export function getFirebaseAuth() {
  return auth;
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserOnServer(uid: string, email: string): Promise<void> {
  await ensureUserDoc(uid, email);
}

export async function isOnboardingComplete(): Promise<boolean> {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function setOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function clearOnboarding() {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}

export async function signOut() {
  await auth.signOut();
  await clearOnboarding();
}
