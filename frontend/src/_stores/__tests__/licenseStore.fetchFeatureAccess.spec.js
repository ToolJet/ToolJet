import { useLicenseStore } from '@/_stores/licenseStore';
import { licenseService } from '@/_services';

jest.mock('@/_services', () => ({
  licenseService: { getFeatureAccess: jest.fn() },
  appsService: {},
}));
jest.mock('@/_services/authentication.service', () => ({ authenticationService: {} }));

describe('licenseStore.fetchFeatureAccess', () => {
  beforeEach(() => {
    useLicenseStore.setState({ featureAccess: {}, featuresLoaded: false });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores the feature access the server returns', async () => {
    licenseService.getFeatureAccess.mockResolvedValue({ modulesEnabled: true });

    await useLicenseStore.getState().actions.fetchFeatureAccess();

    expect(useLicenseStore.getState()).toMatchObject({ featureAccess: { modulesEnabled: true }, featuresLoaded: true });
  });

  // Break this catches: a failed licence request rejecting with no handler. Callers fire and forget, so
  // in Jest the rejection kills the worker process after the test ends; in the browser it is uncaught.
  it('settles a failed request instead of rejecting, and leaves the state as it was', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    licenseService.getFeatureAccess.mockRejectedValue(new TypeError('fetch failed'));

    await expect(useLicenseStore.getState().actions.fetchFeatureAccess()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith('Failed to load feature access', expect.any(TypeError));
    expect(useLicenseStore.getState()).toMatchObject({ featureAccess: {}, featuresLoaded: false });
  });
});
