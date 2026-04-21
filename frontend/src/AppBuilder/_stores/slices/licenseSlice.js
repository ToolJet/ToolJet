import { licenseService } from '@/_services';
import _ from 'lodash';

const initialState = {
  license: {},
  // Tracks whether the license/feature-access fetch has settled (resolved or rejected).
  // useAppData gates loadLibrariesAndRun on this flag to avoid reading featureAccess
  // before it arrives — without the gate, JS libraries were silently skipped on public
  // and released apps because featureAccess?.appJsLibraries was still undefined when
  // isComponentLayoutReady fired.
  isLicenseFetched: false,
};

export const createLicenseSlice = (set, get) => ({
  ...initialState,
  updateFeatureAccess: () => {
    set((state) => {
      state.isLicenseFetched = false;
    });
    licenseService
      .getFeatureAccess()
      .then((data) => {
        set((state) => {
          state.license = {
            featureAccess: data,
          };
          state.isLicenseFetched = true;
        });
      })
      .catch(() => {
        // For public/unauthenticated apps the license API may be inaccessible.
        // Still mark as fetched so loadLibrariesAndRun is not blocked indefinitely.
        set((state) => {
          state.isLicenseFetched = true;
        });
      });
  },
  isLicenseValid: () => {
    const featureAccess = get().license.featureAccess;
    const licenseStatus = featureAccess?.licenseStatus;
    if (licenseStatus) {
      if (licenseStatus?.isExpired) return false;
      return licenseStatus?.isLicenseValid && !licenseStatus?.isExpired;
    }
    return false;
  },
  isFeatureAccessible: (featureName) => {
    return get().license.featureAccess?.[featureName] ?? false;
  },
});
