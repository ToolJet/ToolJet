const withTrailingSlash = (path) => (path.endsWith('/') ? path : path + '/');

export const getI18nConfig = ({ language = 'en', path = '/' } = {}) => ({
  load: 'all',
  fallbackLng: 'en',
  lng: language,
  backend: {
    loadPath: withTrailingSlash(path) + 'assets/translations/{{lng}}.json',
  },
});
