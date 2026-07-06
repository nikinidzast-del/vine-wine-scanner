import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getFirebaseAdmin() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  const { FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID } = process.env;
  if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY && FIREBASE_PROJECT_ID) {
    return initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  try {
    const creds = require('../../firebase-credentials.json');
    return initializeApp({ credential: cert(creds) });
  } catch {
    throw new Error('Firebase credentials not configured. Set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID env vars.');
  }
}

const FREE_TIER_SCANS = 5;

const SCAN_PROMPT = `You are a wine label analysis AI. Analyze the wine label image and extract structured information.

Return a JSON object with the following fields:
- wineName: The name of the wine (or null if not visible)
- producer: The winery/producer name (or null)
- vintage: The vintage year (or null)
- grapeVariety: The grape variety/varietals (or null)
- region: The wine region/appellation (or null)
- abv: The alcohol percentage as a string like "13.5%" (or null)

For each field, also provide a confidence score: "high", "medium", or "low".
- Use "high" when the text is clearly visible and unambiguous
- Use "medium" when partially visible or some ambiguity
- Use "low" when barely visible or you're guessing
- Use null for the field value when you cannot determine it at all

IMPORTANT: Do NOT fabricate or guess information. If you are not confident about a field, set it to null with a low confidence score. It is better to return null than to make up incorrect data.

Return ONLY valid JSON, no markdown formatting, no other text.`;

const ENRICHMENT_PROMPT = `You are a wine knowledge expert. Based on the wine information provided, enrich it with additional data.

Given the wine details, return a JSON object with:
- priceRange: The estimated price range for this wine based on known market data (e.g., "€15-€25"). If uncertain, provide a reasonable range.
- priceConfidence: "high", "medium", or "low". Use "high" if you know the price from reliable knowledge, "medium" if you have a general sense, "low" if you're speculating.
- reviewSummary: A brief 1-2 sentence summary of typical consumer and critic reception for this wine. Aggregate the tone and common praise/criticism. Do NOT fabricate specific quotes or ratings.
- wineryStory: A brief 2-3 sentence description of the winery/producer, their history, region style, and winemaking philosophy.

CRITICAL: Do NOT fabricate specific facts. If you don't know something, indicate low confidence. Never make up specific critic scores, ratings, or quotes. Aggregate general impressions only.

Return ONLY valid JSON, no markdown formatting, no other text.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const idToken = authHeader.slice(7);

    const app = getFirebaseAdmin();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || '';

    const { image, mimeType, language } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({
        email,
        preferredWineType: null,
        subscriptionStatus: 'free',
        onboarded: false,
        createdAt: Timestamp.now(),
      });
    }

    const usageRef = db.collection('scanUsage').doc(uid);
    const quotaResult = await db.runTransaction(async (tx) => {
      const usageDoc = await tx.get(usageRef);
      const now = Timestamp.now();
      const thirtyDaysAgo = new Date(now.toMillis() - 30 * 24 * 60 * 60 * 1000);

      let scanCount = 0;
      let periodStart = now;

      if (usageDoc.exists) {
        const data = usageDoc.data()!;
        const periodStartDate = data.periodStart?.toDate?.() || new Date(0);
        if (periodStartDate < thirtyDaysAgo) {
          scanCount = 0;
          periodStart = now;
        } else {
          scanCount = data.scanCount || 0;
          periodStart = data.periodStart;
        }
      }

      const subscriptionStatus = (await tx.get(userRef)).data()?.subscriptionStatus || 'free';
      const remaining = subscriptionStatus === 'premium' ? Infinity : Math.max(0, FREE_TIER_SCANS - scanCount);

      if (remaining <= 0) {
        const resetsAt = new Date(periodStart.toMillis() + 30 * 24 * 60 * 60 * 1000);
        return { allowed: false, remaining: 0, resetsAt: resetsAt.toISOString() };
      }

      tx.set(usageRef, {
        scanCount: scanCount + 1,
        periodStart,
        updatedAt: now,
      }, { merge: true });

      return { allowed: true, remaining: remaining - 1, resetsAt: null };
    });

    if (!quotaResult.allowed) {
      return res.status(402).json({ error: 'Quota exceeded', resetsAt: quotaResult.resetsAt });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'user',
        parts: [{ text: language ? `${SCAN_PROMPT}\n\nPlease respond in ${language}.` : SCAN_PROMPT }],
      },
    });

    const scanResult = await model.generateContent([
      SCAN_PROMPT,
      { inlineData: { data: image, mimeType: mimeType || 'image/jpeg' } },
    ]);

    const scanText = scanResult.response.text();
    const cleaned = scanText.replace(/```json?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const extractField = (key: string): string | null => {
      const val = parsed[key];
      if (val === null || val === undefined) return null;
      if (typeof val === 'object') return val.value || null;
      return String(val);
    };

    const extractConfidence = (key: string): 'high' | 'medium' | 'low' => {
      if (parsed.confidence?.[key]) return parsed.confidence[key];
      const val = parsed[key];
      if (val && typeof val === 'object' && val.confidence) return val.confidence;
      return 'low';
    };

    const wineData = {
      wineName: extractField('wineName'),
      producer: extractField('producer'),
      vintage: extractField('vintage'),
      grapeVariety: extractField('grapeVariety'),
      region: extractField('region'),
      abv: extractField('abv'),
      confidence: JSON.stringify({
        wineName: extractConfidence('wineName'),
        producer: extractConfidence('producer'),
        vintage: extractConfidence('vintage'),
        grapeVariety: extractConfidence('grapeVariety'),
        region: extractConfidence('region'),
        abv: extractConfidence('abv'),
        overall: extractConfidence('overall'),
      }),
    };

    let enrichment = {
      priceRange: null as string | null,
      priceConfidence: null as string | null,
      reviewSummary: null as string | null,
      wineryStory: null as string | null,
    };

    if (wineData.wineName || wineData.producer || wineData.region) {
      try {
        const enrichModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: {
            role: 'user',
            parts: [{ text: language ? `${ENRICHMENT_PROMPT}\n\nPlease respond in ${language}.` : ENRICHMENT_PROMPT }],
          },
        });

        const wineInfo = Object.entries(wineData)
          .filter(([k, v]) => k !== 'confidence' && v)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');

        const enrichResult = await enrichModel.generateContent([
          `Wine details:\n${wineInfo || 'Unknown wine'}`,
        ]);

        const enrichText = enrichResult.response.text();
        const enrichCleaned = enrichText.replace(/```json?/gi, '').replace(/```/g, '').trim();
        const enrichParsed = JSON.parse(enrichCleaned);

        enrichment = {
          priceRange: enrichParsed.priceRange || null,
          priceConfidence: enrichParsed.priceConfidence || null,
          reviewSummary: enrichParsed.reviewSummary || null,
          wineryStory: enrichParsed.wineryStory || null,
        };
      } catch (e) {
        console.warn('Enrichment failed, continuing without:', e);
      }
    }

    const scanId = db.collection('scans').doc().id;
    const scanData = {
      id: scanId,
      userId: uid,
      wineName: wineData.wineName,
      producer: wineData.producer,
      vintage: wineData.vintage,
      grapeVariety: wineData.grapeVariety,
      region: wineData.region,
      abv: wineData.abv,
      priceRange: enrichment.priceRange,
      priceConfidence: enrichment.priceConfidence,
      reviewSummary: enrichment.reviewSummary,
      wineryStory: enrichment.wineryStory,
      confidence: wineData.confidence,
      createdAt: Timestamp.now(),
    };

    await db.collection('scans').doc(scanId).set(scanData);

    return res.status(200).json({
      scan: scanData,
      quota: {
        remaining: quotaResult.remaining,
        resetsAt: quotaResult.resetsAt,
      },
    });

  } catch (error: any) {
    console.error('Scan error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Scan failed' });
  }
}
