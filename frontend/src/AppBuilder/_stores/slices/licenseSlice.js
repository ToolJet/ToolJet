import { licenseService } from '@/_services';
import _ from 'lodash';
import { isQueryCacheLicensed } from '@/AppBuilder/_utils/queryResponseCache';

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
        const wasCacheLicensed = isQueryCacheLicensed(get());
        set((state) => {
          state.license = {
            featureAccess: data,
          };
          state.isLicenseFetched = true;
        });
        // queries.<name>.refresh() hints depend on the queryResponseCache license. Suggestions already built for the
        // editor (always the 'canvas' module) must follow a license gained or lost in the same session.
        if (get()._suggestionsInitialized && isQueryCacheLicensed(get()) !== wasCacheLicensed) {
          get().rebuildQueryHints('canvas');
        }
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
