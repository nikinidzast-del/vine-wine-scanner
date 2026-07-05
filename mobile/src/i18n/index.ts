import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import sr from './sr.json';
import it from './it.json';
import fr from './fr.json';

const STORAGE_KEY = '@vino_language';

const locales = getLocales();
const deviceLanguage = locales?.[0]?.languageCode || 'en';

const initLang = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch (e) { console.warn('Failed to read stored language', e); }

  if (['sr', 'hr', 'bs'].includes(deviceLanguage)) return 'sr';
  if (deviceLanguage === 'it') return 'it';
  if (deviceLanguage === 'fr') return 'fr';
  return 'en';
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (e) { console.warn('Failed to persist language preference', e); }
};

initLang().then((lng) => {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      sr: { translation: sr },
      it: { translation: it },
      fr: { translation: fr },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
});

export const languageOptions = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'sr', label: 'Srpski', native: 'Srpski' },
  { code: 'it', label: 'Italiano', native: 'Italiano' },
  { code: 'fr', label: 'Français', native: 'Français' },
];

export default i18n;
