import { isFeatureEnabled } from '../features';

describe('isFeatureEnabled', () => {
  afterEach(() => delete window.public_config);

  test('everything is on by default', () => {
    expect(isFeatureEnabled('propagation')).toBe(true);
  });

  test('DISABLE_BACKGROUND_DATA turns the listed parts off', () => {
    window.public_config = { DISABLE_BACKGROUND_DATA: 'propagation, text-search' };
    expect(isFeatureEnabled('propagation')).toBe(false);
    expect(isFeatureEnabled('text-search')).toBe(false);
    expect(isFeatureEnabled('transport')).toBe(true);
  });
});
