import { createInstance } from 'i18next';
import { getI18nConfig } from '../i18nConfig';

describe('getI18nConfig', () => {
  it('keeps region-specific locale codes for translation loading', () => {
    const config = getI18nConfig({ language: 'zh-TW', path: '/' });

    expect(config).toMatchObject({
      load: 'all',
      fallbackLng: 'en',
      lng: 'zh-TW',
      backend: {
        loadPath: '/assets/translations/{{lng}}.json',
      },
    });
  });

  it('resolves zh-TW before the base and fallback locales', () => {
    const i18n = createInstance();

    i18n.init({
      ...getI18nConfig({ language: 'zh-TW', path: '/' }),
      initImmediate: false,
    });

    expect(i18n.languages).toEqual(['zh-TW', 'zh', 'en']);
  });

  it('keeps the configured sub-path in the translation load path', () => {
    const config = getI18nConfig({ language: 'fr', path: '/app/' });

    expect(config.backend.loadPath).toBe('/app/assets/translations/{{lng}}.json');
  });

  it('normalizes sub-paths without a trailing slash', () => {
    const config = getI18nConfig({ language: 'fr', path: '/app' });

    expect(config.backend.loadPath).toBe('/app/assets/translations/{{lng}}.json');
  });
});
