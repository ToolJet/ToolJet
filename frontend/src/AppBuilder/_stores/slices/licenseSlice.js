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
  updateFeatureAccess: async () => {
    const workspaceId = get().appStore.modules.canvas?.app?.organizationId;
    const requestId = (get().licenseAccessRequestId ?? 0) + 1;
    set((state) => {
      state.license = {};
      state.isLicenseFetched = false;
      state.licenseAccessRequestId = requestId;
    });
    const current = () =>
      get().licenseAccessRequestId === requestId && get().appStore.modules.canvas?.app?.organizationId === workspaceId;
    try {
      const data = await licenseService.getFeatureAccess({ workspaceId });
      if (current())
        set((state) => {
          state.license = { featureAccess: data };
          state.isLicenseFetched = true;
        });
    } catch {
      if (current())
        set((state) => {
          state.license = {};
          state.isLicenseFetched = true;
        });
    }
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
