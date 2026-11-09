import { getRedirectURL } from '@/_helpers/routes';

describe('getRedirectURL', () => {
  test.each(['/all-users', '/llm-key', '/ai-credits-usage'])(
    'should send instance settings path %s back under /settings',
    (path) => {
      expect(getRedirectURL(path)).toBe(`/settings${path}`);
    }
  );
});
