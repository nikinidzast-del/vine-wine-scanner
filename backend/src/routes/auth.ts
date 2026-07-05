import { Router } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '../index.js';
import { getFirebaseApp } from '../services/firebase.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/firebase-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required' });
      return;
    }

    getFirebaseApp();
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || '';

    let user = await prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid,
          email,
          subscriptionStatus: 'free',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { firebaseUid },
        data: { email },
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        preferredWineType: user.preferredWineType,
        subscriptionStatus: user.subscriptionStatus,
        onboarded: user.onboarded,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        _count: { select: { scans: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        preferredWineType: user.preferredWineType,
        subscriptionStatus: user.subscriptionStatus,
        onboarded: user.onboarded,
        createdAt: user.createdAt,
        scanCount: user._count.scans,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/onboarded', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { onboarded: true },
    });
    res.json({ onboarded: user.onboarded });
  } catch (error) {
    console.error('Onboarded update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/delete-account', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.scanUsage.deleteMany({ where: { userId: req.userId } });
      await tx.wineScan.deleteMany({ where: { userId: req.userId } });
      await tx.user.delete({ where: { id: req.userId } });
    });

    if (req.firebaseUid) {
      try {
        await getAuth().deleteUser(req.firebaseUid);
      } catch (fbError) {
        console.error('Firebase delete user error:', fbError);
      }
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});
