import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../index.js';
import { checkScanQuota } from '../services/quota.js';

export const userRouter = Router();

userRouter.patch(
  '/preferences',
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { preferredWineType } = req.body;

      if (!['red', 'white', 'rose', 'sparkling', 'any'].includes(preferredWineType)) {
        res.status(400).json({ error: 'Invalid wine type' });
        return;
      }

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { preferredWineType },
      });

      res.json({ preferredWineType: user.preferredWineType });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
);

userRouter.get('/quota', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const quota = await checkScanQuota(req.userId!);
    res.json(quota);
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({ error: 'Failed to check quota' });
  }
});

userRouter.post('/premium-status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { isPremium } = req.body;

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        subscriptionStatus: isPremium ? 'premium' : 'free',
      },
    });

    res.json({ subscriptionStatus: isPremium ? 'premium' : 'free' });
  } catch (error) {
    console.error('Update premium status error:', error);
    res.status(500).json({ error: 'Failed to update premium status' });
  }
});
