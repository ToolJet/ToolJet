// eslint-disable-next-line import/no-unresolved
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    load: 'languageOnly',
    fallbackLng: 'fr',
    backend: {
      loadPath: `/assets/translations/{{ns}}/{{lng}}.json`,
    },
    ns: ['editor', 'dashboard'],
  });

export default i18n;
