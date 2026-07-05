import { Platform } from 'react-native';

const PROD_API_URL = 'https://vino-scanner.onrender.com';

const BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://127.0.0.1:3002',
      ios: 'http://localhost:3002',
      default: 'http://localhost:3002',
    })
  : PROD_API_URL;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 402) {
    const body = await response.json();
    throw new QuotaExceededError(body.resetsAt);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.error || `HTTP ${response.status}`,
      response.status
    );
  }

  return response.json();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export class QuotaExceededError extends Error {
  resetsAt: string;
  constructor(resetsAt: string) {
    super('Quota exceeded');
    this.resetsAt = resetsAt;
    this.name = 'QuotaExceededError';
  }
}

export const api = {
  auth: {
    firebaseLogin: (idToken: string) =>
      request<{ user: any }>('/api/auth/firebase-login', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }),

    getMe: () => request<{ user: any }>('/api/auth/me'),

    markOnboarded: () =>
      request<{ onboarded: boolean }>('/api/auth/onboarded', {
        method: 'POST',
      }),

    deleteAccount: () =>
      request<{ message: string }>('/api/auth/delete-account', {
        method: 'POST',
      }),
  },

  scan: {
    upload: (imageUri: string, language?: string) => {
      return new Promise<{ scan: any; quota: { remaining: number; resetsAt: string } }>((resolve, reject) => {
        const formData = new FormData();
        formData.append('image', { uri: imageUri, name: 'label.jpg', type: 'image/jpeg' } as any);
        if (language) formData.append('language', language);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE_URL}/api/scan`);

        if (authToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        }

        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText);
            if (xhr.status === 402) {
              reject(new QuotaExceededError(body.resetsAt));
            } else if (xhr.status !== 200) {
              reject(new ApiError(body.error || `HTTP ${xhr.status}`, xhr.status));
            } else {
              resolve(body);
            }
          } catch (e) {
            reject(new ApiError('Invalid response', xhr.status));
          }
        };

        xhr.onerror = () => reject(new ApiError('Network error', 0));
        xhr.send(formData);
      });
    },

    getHistory: (page: number = 1, limit: number = 20) =>
      request<{ scans: any[]; pagination: any }>(
        `/api/scan/history?page=${page}&limit=${limit}`
      ),

    getById: (id: string) =>
      request<{ scan: any }>(`/api/scan/${id}`),
  },

  user: {
    updatePreferences: (preferredWineType: string) =>
      request<{ preferredWineType: string }>('/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ preferredWineType }),
      }),

    getQuota: () => request<{ allowed: boolean; remaining: number; resetsAt: string | null }>(
      '/api/user/quota'
    ),

    updatePremiumStatus: (isPremium: boolean) =>
      request<{ subscriptionStatus: string }>('/api/user/premium-status', {
        method: 'POST',
        body: JSON.stringify({ isPremium }),
      }),
  },
};
