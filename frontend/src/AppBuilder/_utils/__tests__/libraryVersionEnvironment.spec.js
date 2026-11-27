import { isLibraryVersionInEnvironment } from '../libraryVersionEnvironment';

const dev = { id: 'dev', priority: 1 };
const staging = { id: 'staging', priority: 2 };
const prod = { id: 'prod', priority: 3 };
const environments = [prod, dev, staging];
const belongs = (isDraft, versionEnvironment, targetEnvironment, configured = environments) =>
  isLibraryVersionInEnvironment({ isDraft, versionEnvironment, targetEnvironment, environments: configured });

// Break this catches: equality filtering or a reversed comparison hides promoted versions in earlier tabs.
it.each([
  ['draft', true, null, [true, false, false]],
  ['Development saved', false, dev, [true, false, false]],
  ['Staging saved', false, staging, [true, true, false]],
  ['Production saved', false, prod, [true, true, true]],
])('shows %s only in eligible environments', (_name, isDraft, versionEnvironment, expected) => {
  expect([dev, staging, prod].map((target) => belongs(isDraft, versionEnvironment, target))).toEqual(expected);
});

// Break this catches: removing the no-filter fallback changes initial selection before environments load.
it.each([true, false])('does not filter without a target environment (draft=%s)', (isDraft) => {
  expect(belongs(isDraft, prod, null)).toBe(true);
});

// Break this catches: ID-only responses lose promotion information despite configured priorities.
it('resolves ID-only environment priorities from configuration', () => {
  expect(belongs(false, { id: prod.id }, { id: staging.id })).toBe(true);
  expect(belongs(true, null, { id: dev.id })).toBe(true);
});

// Break this catches: stale response priorities override the configured promotion order.
it('uses configured priorities before response priorities', () => {
  expect(belongs(false, { ...dev, priority: 3 }, staging)).toBe(false);
});

// Break this catches: missing metadata accidentally grants access to higher environments.
it('keeps unknown saved environments in Development only', () => {
  expect([dev, staging, prod].map((target) => belongs(false, { id: 'missing' }, target))).toEqual([true, false, false]);
  expect(belongs(false, prod, { id: 'missing' })).toBe(false);
});

// Break this catches: assuming environment configuration is already loaded hides otherwise known membership.
it('uses supplied priorities when configuration is unavailable', () => {
  expect(belongs(false, prod, staging, [])).toBe(true);
  expect(belongs(true, prod, staging, [])).toBe(false);
});
