import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'hi', // Default language is Hindi per accessibility story
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safe from XSS
  },
  compatibilityJSON: 'v4',
});

export default i18n;
