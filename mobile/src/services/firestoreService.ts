import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, startAfter, getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeAuth } from './firebase';

const app = initializeAuth();
const db = getFirestore(app);

export interface UserData {
  id: string;
  email: string;
  preferredWineType: string | null;
  subscriptionStatus: 'free' | 'premium';
  onboarded: boolean;
  createdAt: Date;
}

export interface WineScan {
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
  confidence: string;
  rawResponse: string | null;
  createdAt: Date;
}

export interface ScanQuota {
  remaining: number;
  resetsAt: string | null;
}

export async function ensureUserDoc(uid: string, email: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      email,
      preferredWineType: null,
      subscriptionStatus: 'free',
      onboarded: false,
      createdAt: Timestamp.now(),
    });
  }
}

export async function getUser(uid: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data()!;
  return {
    id: snap.id,
    email: data.email || '',
    preferredWineType: data.preferredWineType || null,
    subscriptionStatus: data.subscriptionStatus || 'free',
    onboarded: data.onboarded || false,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function updateUserPreferences(uid: string, preferredWineType: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { preferredWineType });
}

export async function markOnboarded(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { onboarded: true });
}

export async function updatePremiumStatus(uid: string, isPremium: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    subscriptionStatus: isPremium ? 'premium' : 'free',
  });
}

export async function deleteUserAccount(uid: string): Promise<void> {
  const scansQuery = query(collection(db, 'scans'), where('userId', '==', uid));
  const scanDocs = await getDocs(scansQuery);
  const batch = [];
  scanDocs.forEach((d) => batch.push(deleteDoc(doc(db, 'scans', d.id))));
  await Promise.all(batch);
  await deleteDoc(doc(db, 'scanUsage', uid));
  await deleteDoc(doc(db, 'users', uid));
}

export async function getScans(uid: string, page: number = 1, pageSize: number = 20): Promise<{ scans: WineScan[]; hasMore: boolean }> {
  let q = query(
    collection(db, 'scans'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  );

  if (page > 1) {
    const prevDocs = await getDocs(query(
      collection(db, 'scans'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit((page - 1) * pageSize),
    ));
    if (prevDocs.docs.length > 0) {
      q = query(
        collection(db, 'scans'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        startAfter(prevDocs.docs[prevDocs.docs.length - 1]),
        limit(pageSize),
      );
    }
  }

  const snapshot = await getDocs(q);
  const scans = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as WineScan;
  });

  return { scans, hasMore: snapshot.docs.length === pageSize };
}

export async function getScanById(scanId: string): Promise<WineScan | null> {
  const snap = await getDoc(doc(db, 'scans', scanId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as WineScan;
}

export async function getQuota(uid: string): Promise<ScanQuota> {
  const snap = await getDoc(doc(db, 'scanUsage', uid));
  if (!snap.exists()) {
    return { remaining: 5, resetsAt: null };
  }
  const data = snap.data()!;
  const periodStart = data.periodStart?.toDate() || new Date(0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  if (periodStart < thirtyDaysAgo) {
    return { remaining: 5, resetsAt: null };
  }

  const scanCount = data.scanCount || 0;
  const remaining = Math.max(0, 5 - scanCount);

  const userSnap = await getDoc(doc(db, 'users', uid));
  const subscriptionStatus = userSnap.data()?.subscriptionStatus || 'free';
  if (subscriptionStatus === 'premium') {
    return { remaining: Infinity, resetsAt: null };
  }

  if (remaining <= 0) {
    const resetsAt = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    return { remaining: 0, resetsAt: resetsAt.toISOString() };
  }

  return { remaining, resetsAt: null };
}
