export interface WineLabelResult {
  wineName: string | null;
  producer: string | null;
  vintage: string | null;
  grapeVariety: string | null;
  region: string | null;
  abv: string | null;
}

export interface ConfidenceScores {
  wineName: 'high' | 'medium' | 'low';
  producer: 'high' | 'medium' | 'low';
  vintage: 'high' | 'medium' | 'low';
  grapeVariety: 'high' | 'medium' | 'low';
  region: 'high' | 'medium' | 'low';
  abv: 'high' | 'medium' | 'low';
  overall: 'high' | 'medium' | 'low';
}

export interface WineEnrichment {
  priceRange: string | null;
  priceConfidence: 'high' | 'medium' | 'low';
  reviewSummary: string | null;
  wineryStory: string | null;
}

export interface ScanQuota {
  allowed: boolean;
  remaining: number;
  resetsAt: Date | null;
}
