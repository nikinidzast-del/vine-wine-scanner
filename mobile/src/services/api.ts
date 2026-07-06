const VERCEl_SCAN_URL = 'https://vino-scanner-api.vercel.app/api/scan';

export function setAuthToken(token: string | null) {}

export class QuotaExceededError extends Error {
  resetsAt: string;
  constructor(resetsAt: string) {
    super('Quota exceeded');
    this.resetsAt = resetsAt;
    this.name = 'QuotaExceededError';
  }
}

export async function scanWine({
  image,
  mimeType,
  language,
  idToken,
}: {
  image: string;
  mimeType?: string;
  language?: string;
  idToken: string;
}): Promise<{ scan: any; quota: { remaining: number; resetsAt: string | null } }> {
  const response = await fetch(VERCEl_SCAN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      image,
      mimeType: mimeType || 'image/jpeg',
      language: language || 'en',
    }),
  });

  const body = await response.json();

  if (response.status === 402) {
    throw new QuotaExceededError(body.resetsAt);
  }

  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }

  return body;
}
