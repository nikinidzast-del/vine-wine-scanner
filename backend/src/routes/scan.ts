import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { analyzeWineLabel, enrichWineData } from '../services/gemini.js';
import { checkScanQuota, incrementScanUsage } from '../services/quota.js';
import { prisma } from '../index.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

export const scanRouter = Router();

scanRouter.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    console.log('📸 Scan request received:', { file: req.file?.originalname, headers: req.headers['content-type'] });
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Image is required' });
        return;
      }

      const quota = await checkScanQuota(req.userId!);
      if (!quota.allowed) {
        res.status(402).json({
          reason: 'quota_exceeded',
          resetsAt: quota.resetsAt,
          remaining: 0,
        });
        return;
      }

      const imageBuffer = fs.readFileSync(req.file.path);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const language = req.body.language || undefined;

      const scanResult = await analyzeWineLabel(imageBase64, mimeType, language);

      let enrichment = null;
      const hasDetails = scanResult.wineName || scanResult.producer || scanResult.region;
      if (hasDetails) {
        enrichment = await enrichWineData(
          {
            wineName: scanResult.wineName,
            producer: scanResult.producer,
            vintage: scanResult.vintage,
            grapeVariety: scanResult.grapeVariety,
            region: scanResult.region,
          },
          language
        );
      }

      await incrementScanUsage(req.userId!);

      const wineScan = await prisma.wineScan.create({
        data: {
          userId: req.userId!,
          imageUrl: req.file.path,
          wineName: scanResult.wineName,
          producer: scanResult.producer,
          vintage: scanResult.vintage,
          grapeVariety: scanResult.grapeVariety,
          region: scanResult.region,
          abv: scanResult.abv,
          priceRange: enrichment?.priceRange || null,
          priceConfidence: enrichment?.priceConfidence || null,
          reviewSummary: enrichment?.reviewSummary || null,
          wineryStory: enrichment?.wineryStory || null,
          confidence: JSON.stringify(scanResult.confidence),
        },
      });

      fs.unlinkSync(req.file.path);

      res.json({
        scan: {
          id: wineScan.id,
          wineName: wineScan.wineName,
          producer: wineScan.producer,
          vintage: wineScan.vintage,
          grapeVariety: wineScan.grapeVariety,
          region: wineScan.region,
          abv: wineScan.abv,
          priceRange: wineScan.priceRange,
          priceConfidence: wineScan.priceConfidence,
          reviewSummary: wineScan.reviewSummary,
          wineryStory: wineScan.wineryStory,
          confidence: wineScan.confidence,
          createdAt: wineScan.createdAt,
        },
        quota: {
          remaining: quota.remaining - 1,
          resetsAt: quota.resetsAt,
        },
      });
    } catch (error) {
      console.error('Scan error:', error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ error: 'Scan failed. Please try again.' });
    }
  }
);

scanRouter.get('/history', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      prisma.wineScan.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          wineName: true,
          producer: true,
          vintage: true,
          region: true,
          grapeVariety: true,
          priceRange: true,
          createdAt: true,
        },
      }),
      prisma.wineScan.count({
        where: { userId: req.userId! },
      }),
    ]);

    res.json({
      scans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

scanRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const scan = await prisma.wineScan.findFirst({
      where: {
        id: req.params.id as string,
        userId: req.userId!,
      },
    });

    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    res.json({ scan });
  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});
