import { initializeApp, getApps, cert } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

function getCredentials() {
  const credPath = process.env.FIREBASE_CREDENTIALS_PATH || path.join(process.cwd(), 'firebase-credentials.json');
  if (fs.existsSync(credPath)) {
    return cert(credPath);
  }
  const { FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID } = process.env;
  if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  throw new Error('Firebase credentials not configured');
}

export function getFirebaseApp() {
  const apps = getApps();
  if (apps.length === 0) {
    return initializeApp({
      credential: getCredentials(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return apps[0];
}
