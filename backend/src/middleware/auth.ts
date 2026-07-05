import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  firebaseUid?: string;
  email?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (process.env.NODE_ENV === 'development' || !authHeader?.startsWith('Bearer ')) {
    let user = await prisma.user.findFirst({ where: { email: 'dev@test.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { firebaseUid: 'dev', email: 'dev@test.com', subscriptionStatus: 'free' },
      });
    }
    req.userId = user.id;
    req.firebaseUid = 'dev';
    req.email = 'dev@test.com';
    next();
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirebaseApp } = await import('../services/firebase.js');
    getFirebaseApp();
    const decodedToken = await getAuth().verifyIdToken(token);

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || '';

    let user = await prisma.user.findUnique({ where: { firebaseUid } });
    if (!user) {
      user = await prisma.user.create({
        data: { firebaseUid, email, subscriptionStatus: 'free' },
      });
    } else if (user.email !== email) {
      user = await prisma.user.update({ where: { firebaseUid }, data: { email } });
    }

    req.userId = user.id;
    req.firebaseUid = firebaseUid;
    req.email = email;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
