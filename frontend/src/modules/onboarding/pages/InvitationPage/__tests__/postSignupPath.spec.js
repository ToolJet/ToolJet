import { getPostSignupPath } from '../postSignupPath';

test.each([
  ['cloud', 'acme', null, '/acme/home'],
  ['ee', 'acme', null, '/acme/home'],
  ['ce', 'acme', null, '/'],
  ['cloud', undefined, null, '/'],
  ['cloud', 'acme', '/acme/apps/my-app', '/acme/apps/my-app'],
])('%s signup in workspace %s with redirectTo %s lands on %s', (edition, organizationSlug, redirectTo, expected) => {
  expect(getPostSignupPath({ edition, organizationSlug, redirectTo })).toBe(expected);
});
