export interface User {
  id: string;
  email: string;
  preferredWineType: string | null;
  subscriptionStatus: 'free' | 'premium';
  onboarded: boolean;
  createdAt: string;
  scanCount?: number;
}

export interface WineScan {
  id: string;
  wineName: string | null;
  producer: string | null;
  vintage: string | null;
  grapeVariety: string | null;
  region: string | null;
  abv: string | null;
  priceRange: string | null;
  priceConfidence: 'high' | 'medium' | 'low' | null;
  reviewSummary: string | null;
  wineryStory: string | null;
  confidence: ConfidenceScores | null;
  createdAt: string;
  imageUrl?: string;
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

export interface ScanQuota {
  allowed: boolean;
  remaining: number;
  resetsAt: string | null;
}

export interface PaginatedResponse<T> {
  scans: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'any';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Scanner: undefined;
  ScanResult: { scanId: string };
  ScanProgress: { imageUri: string };
  History: undefined;
  WineDetail: { scanId: string };
  Paywall: { reason?: 'quota_exceeded' | 'upgrade' };
  Profile: undefined;
};

export type OnboardingParamList = {
  Welcome: undefined;
  ValueProp1: undefined;
  ValueProp2: undefined;
  ValueProp3: undefined;
  AuthChoice: undefined;
  EmailSignUp: undefined;
  EmailSignIn: undefined;
  ForgotPassword: undefined;
  Preferences: undefined;
  PaywallPreview: undefined;
};

export type AuthScreen = 'EmailSignUp' | 'EmailSignIn' | 'ForgotPassword';
