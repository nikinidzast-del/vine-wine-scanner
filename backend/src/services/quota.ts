import { prisma } from '../index.js';

const FREE_TIER_SCANS = 5;

export async function checkScanQuota(
  userId: string
): Promise<{ allowed: boolean; remaining: number; resetsAt: Date | null }> {
  const usage = await prisma.scanUsage.findUnique({
    where: { userId },
  });

  if (!usage) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await prisma.scanUsage.create({
      data: {
        userId,
        scanCount: 0,
        periodStart: now,
      },
    });

    return { allowed: true, remaining: FREE_TIER_SCANS, resetsAt: periodEnd };
  }

  const periodEnd = new Date(usage.periodStart);
  periodEnd.setDate(periodEnd.getDate() + 30);

  if (new Date() > periodEnd) {
    const now = new Date();
    const newPeriodEnd = new Date(now);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

    await prisma.scanUsage.update({
      where: { userId },
      data: {
        scanCount: 0,
        periodStart: now,
      },
    });

    return { allowed: true, remaining: FREE_TIER_SCANS, resetsAt: newPeriodEnd };
  }

  const remaining = Math.max(0, FREE_TIER_SCANS - usage.scanCount);

  if (remaining <= 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.subscriptionStatus === 'premium') {
      return { allowed: true, remaining: Infinity, resetsAt: null };
    }
    return { allowed: false, remaining: 0, resetsAt: periodEnd };
  }

  return { allowed: true, remaining, resetsAt: periodEnd };
}

export async function incrementScanUsage(userId: string): Promise<void> {
  await prisma.scanUsage.upsert({
    where: { userId },
    update: {
      scanCount: { increment: 1 },
    },
    create: {
      userId,
      scanCount: 1,
      periodStart: new Date(),
    },
  });
}
