import { registerLocale } from 'react-datepicker';

// Import date-fns locales for react-datepicker calendar localization
import { enUS, zhCN, fr, de, es, ru, uk, it, id as idLocale } from 'date-fns/locale';

// Register all supported locales
registerLocale('en', enUS);
registerLocale('zh', zhCN);
registerLocale('fr', fr);
registerLocale('de', de);
registerLocale('es', es);
registerLocale('ru', ru);
registerLocale('uk', uk);
registerLocale('it', it);
registerLocale('id', idLocale);

// Map i18n language codes to date-fns locale identifiers
const localeMap = {
  en: 'en',
  zh: 'zh',
  fr: 'fr',
  de: 'de',
  es: 'es',
  ru: 'ru',
  uk: 'uk',
  it: 'it',
  id: 'id',
};

/**
 * Get the date-fns locale identifier for the current i18n language
 * @param {string} language - The current i18n language code
 * @returns {string} The date-fns locale identifier
 */
export const getDateLocale = (language) => {
  return localeMap[language] || 'en';
};
