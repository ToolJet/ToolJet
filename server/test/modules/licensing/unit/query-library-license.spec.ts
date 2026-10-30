import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { Terms } from '@modules/licensing/interfaces/terms';

/** @group platform */
describe('Query Library effective license', () => {
  const license = (terms?: Partial<Terms>) => new LicenseBase(BASIC_PLAN_TERMS, terms);
  const resolve = (terms?: Partial<Terms>) => getLicenseFieldValue(LICENSE_FIELD.QUERY_LIBRARY, license(terms));

  it.each([
    ['legacy', { expiry: '2099-01-01' }, true],
    ['enabled', { expiry: '2099-01-01', queryLibrary: { enabled: true } }, true],
    ['disabled', { expiry: '2099-01-01', queryLibrary: { enabled: false } }, false],
    ['empty object', { expiry: '2099-01-01', queryLibrary: {} }, false],
    ['null object', { expiry: '2099-01-01', queryLibrary: null }, false],
    ['non-boolean', { expiry: '2099-01-01', queryLibrary: { enabled: 'true' } }, false],
    ['expired', { expiry: '2000-01-01', queryLibrary: { enabled: true } }, false],
  ])('resolves %s terms consistently in feature access', (_name, terms, enabled) => {
    const instance = license(terms as Partial<Terms>);
    expect(getLicenseFieldValue(LICENSE_FIELD.QUERY_LIBRARY, instance)).toBe(enabled);
    expect(instance.features).toMatchObject({ queryLibraryEnabled: enabled });
  });

  it('denies absent license through production basic fallback', () => {
    const environment = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      expect(resolve()).toBe(false);
    } finally {
      process.env.NODE_ENV = environment;
    }
  });

  it('denies invalid license through basic fallback', () => {
    const instance = license({ expiry: '2099-01-01', queryLibrary: { enabled: true } });
    jest.spyOn(instance, 'isValid', 'get').mockReturnValue(false);
    expect(getLicenseFieldValue(LICENSE_FIELD.QUERY_LIBRARY, instance)).toBe(false);
  });

  it.each([true, false])('keeps Modules independent when Query Library is %s', (enabled) => {
    const instance = license({ expiry: '2099-01-01', queryLibrary: { enabled }, modules: { enabled: !enabled } });
    expect(getLicenseFieldValue(LICENSE_FIELD.QUERY_LIBRARY, instance)).toBe(enabled);
    expect(getLicenseFieldValue(LICENSE_FIELD.MODULES, instance)).toBe(!enabled);
  });
});
