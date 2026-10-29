import { licenseService } from '@/_services';
import { useLicenseStore } from '@/_stores/licenseStore';

const initialState = {
  featureAccess: null,
};

export const createEditorLicenseSlice = (set) => ({
  ...initialState,
  updateFeatureAccess: () => {
    // Reuse Layout's useLicenseStore fetch; fallback if not hydrated (deep-link race).
    const cached = useLicenseStore.getState().featureAccess;
    if (cached && Object.keys(cached).length > 0) {
      set({ featureAccess: cached });
      return;
    }
    licenseService.getFeatureAccess().then((data) => {
      set({ featureAccess: data });
    });
  },
});
