import { handleAppAccess } from '../handleAppAccess';
import { appsService } from '@/_services';
import { getQueryParams, redirectToErrorPage } from '@/_helpers/routes';

jest.mock('@/_services', () => ({
  organizationService: {},
  authenticationService: { currentSessionValue: {} },
  appsService: { validatePrivateApp: jest.fn(), validateReleasedApp: jest.fn() },
}));
jest.mock('@/_helpers/routes', () => ({
  getSubpath: jest.fn(),
  getQueryParams: jest.fn(),
  getPreviewQueryParams: jest.fn(() => ({ version: 'bogus' })),
  redirectToErrorPage: jest.fn(),
}));

const unknownVersion = {
  error: 'x',
  data: { statusCode: 404, message: "Couldn't found app version. Please check the version name" },
};

describe('handleAppAccess with an unknown ?version=', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getQueryParams.mockReturnValue({ version: 'bogus' });
    window.history.replaceState(null, '', '/ws/apps/my-app?branch=master&version=bogus');
  });

  it('editor: drops ?version= from the URL and retries without it', async () => {
    appsService.validatePrivateApp.mockRejectedValueOnce(unknownVersion).mockResolvedValueOnce({ id: 'app-1' });

    const result = await handleAppAccess('editor', 'my-app');

    expect(result).toEqual({ id: 'app-1' });
    const retryParams = appsService.validatePrivateApp.mock.calls[1][1];
    expect(retryParams).not.toHaveProperty('version');
    expect(retryParams).not.toHaveProperty('version_name');
    expect(window.location.search).toBe('?branch=master');
    expect(redirectToErrorPage).not.toHaveBeenCalled();
  });

  it('editor: still shows the error page when the retry fails too', async () => {
    appsService.validatePrivateApp.mockRejectedValue(unknownVersion);

    await handleAppAccess('editor', 'my-app');

    expect(appsService.validatePrivateApp).toHaveBeenCalledTimes(2);
    expect(redirectToErrorPage).toHaveBeenCalled();
  });

  it('viewer preview: keeps the 404 and shows the error page, no retry', async () => {
    appsService.validatePrivateApp.mockRejectedValue(unknownVersion);

    await handleAppAccess('viewer', 'my-app');

    expect(appsService.validatePrivateApp).toHaveBeenCalledTimes(1);
    expect(redirectToErrorPage).toHaveBeenCalled();
  });

  it('editor: does not retry on an app-not-ready 404', async () => {
    appsService.validatePrivateApp.mockRejectedValue({ data: { statusCode: 404, message: 'app-not-ready' } });

    await handleAppAccess('editor', 'my-app');

    expect(appsService.validatePrivateApp).toHaveBeenCalledTimes(1);
  });
});
