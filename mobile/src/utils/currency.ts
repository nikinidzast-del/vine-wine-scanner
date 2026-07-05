import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const CURRENCY_KEY = '@vino_currency';
const LANG_KEY = '@vino_language';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
}

const currencies: Record<string, CurrencyConfig> = {
  usd: { code: 'usd', symbol: '$', rate: 1 },
  eur: { code: 'eur', symbol: '€', rate: 0.92 },
  rsd: { code: 'rsd', symbol: 'дин', rate: 110 },
};

const langToCurrency: Record<string, string> = {
  en: 'usd',
  sr: 'rsd',
  it: 'eur',
  fr: 'eur',
};

export async function getCurrencyConfig(): Promise<CurrencyConfig> {
  try {
    const stored = await AsyncStorage.getItem(CURRENCY_KEY);
    if (stored && currencies[stored]) return currencies[stored];
  } catch {}

  try {
    const storedLang = await AsyncStorage.getItem(LANG_KEY);
    if (storedLang && langToCurrency[storedLang]) {
      return currencies[langToCurrency[storedLang]];
    }
  } catch {}

  const lang = i18n.language || 'en';
  const code = langToCurrency[lang] || 'usd';
  return currencies[code];
}

export function formatPrice(usdPrice: number, config: CurrencyConfig): string {
  const converted = (usdPrice * config.rate).toFixed(config.code === 'rsd' ? 0 : 2);
  if (config.code === 'rsd') {
    return `${converted} ${config.symbol}`;
  }
  return `${config.symbol}${converted}`;
}

export function formatMonthly(usdPrice: number, config: CurrencyConfig): string {
  const converted = (usdPrice * config.rate).toFixed(2);
  return `${config.symbol}${converted}/month`;
}
