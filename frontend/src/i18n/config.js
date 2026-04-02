import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
const resources = {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
};
// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
i18next
    .use(initReactI18next)
    .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
        bindI18n: 'languageChanged loaded',
        bindI18nStore: 'added removed',
    },
});
export default i18next;
//# sourceMappingURL=config.js.map