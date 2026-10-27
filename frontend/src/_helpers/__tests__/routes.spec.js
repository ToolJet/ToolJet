import { excludeWorkspaceIdFromURL, getRedirectURL } from '../routes';

describe('sign-in redirect back to an instance settings page', () => {
  test.each(['/settings/migrations', '/settings/all-users'])('returns to %s', (page) => {
    const redirectTo = excludeWorkspaceIdFromURL(page);

    expect(getRedirectURL(redirectTo)).toBe(page);
  });
});
