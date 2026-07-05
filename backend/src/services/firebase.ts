import { applicationDefault, initializeApp, getApps } from 'firebase-admin/app';

export function getFirebaseApp() {
  const apps = getApps();
  if (apps.length === 0) {
    return initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return apps[0];
}
