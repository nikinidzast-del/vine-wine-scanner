import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface WineScanResult {
  wineName: string | null;
  producer: string | null;
  vintage: string | null;
  grapeVariety: string | null;
  region: string | null;
  abv: string | null;
  confidence: {
    wineName: 'high' | 'medium' | 'low';
    producer: 'high' | 'medium' | 'low';
    vintage: 'high' | 'medium' | 'low';
    grapeVariety: 'high' | 'medium' | 'low';
    region: 'high' | 'medium' | 'low';
    abv: 'high' | 'medium' | 'low';
    overall: 'high' | 'medium' | 'low';
  };
}

interface WineEnrichment {
  priceRange: string | null;
  priceConfidence: 'high' | 'medium' | 'low';
  reviewSummary: string | null;
  wineryStory: string | null;
}

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

export async function analyzeWineLabel(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language?: string
): Promise<WineScanResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: {
      role: 'user',
      parts: [{ text: language ? `${SCAN_PROMPT}\n\nPlease respond in ${language}.` : SCAN_PROMPT }],
    },
  });

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await model.generateContent([SCAN_PROMPT, imagePart]);
  const response = result.response;
  const text = response.text();

  const cleaned = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  const extract = (key: string): string | null => {
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

  return {
    wineName: extract('wineName'),
    producer: extract('producer'),
    vintage: extract('vintage'),
    grapeVariety: extract('grapeVariety'),
    region: extract('region'),
    abv: extract('abv'),
    confidence: {
      wineName: extractConfidence('wineName'),
      producer: extractConfidence('producer'),
      vintage: extractConfidence('vintage'),
      grapeVariety: extractConfidence('grapeVariety'),
      region: extractConfidence('region'),
      abv: extractConfidence('abv'),
      overall: extractConfidence('overall'),
    },
  };
}

export async function enrichWineData(
  wineDetails: {
    wineName: string | null;
    producer: string | null;
    vintage: string | null;
    grapeVariety: string | null;
    region: string | null;
  },
  language?: string
): Promise<WineEnrichment> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: {
      role: 'user',
      parts: [{ text: language ? `${ENRICHMENT_PROMPT}\n\nPlease respond in ${language}.` : ENRICHMENT_PROMPT }],
    },
  });

  const wineInfo = Object.entries(wineDetails)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const result = await model.generateContent([
    `Wine details:\n${wineInfo || 'Unknown wine'}`,
  ]);
  const response = result.response;
  const text = response.text();

  const cleaned = text.replace(/```json?/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    priceRange: parsed.priceRange || null,
    priceConfidence: parsed.priceConfidence || 'low',
    reviewSummary: parsed.reviewSummary || null,
    wineryStory: parsed.wineryStory || null,
  };
}
