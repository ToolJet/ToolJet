import { suggestVersionName } from '../versionNames';

describe('suggestVersionName', () => {
  const versions = (...names) => names.map((name) => ({ name }));

  it('suggests the next number for a draft named after its parent', () => {
    expect(suggestVersionName('v1_1', versions('v1', 'v1_1'))).toBe('v2');
    expect(suggestVersionName('v3_2', versions('v1', 'v2', 'v3', 'v3_1', 'v3_2'))).toBe('v4');
  });

  it('keeps a name the user chose, or one the app does not number', () => {
    expect(suggestVersionName('checkout-fix', versions('v1', 'checkout-fix'))).toBe('checkout-fix');
    expect(suggestVersionName('beta_1', versions('beta', 'beta_1'))).toBe('beta_1');
    expect(suggestVersionName('', versions('v1'))).toBe('');
  });

  it('keeps the name when its parent is not a version of this app', () => {
    expect(suggestVersionName('v1_1', versions('v1_1'))).toBe('v1_1');
  });
});
