import { licenseService } from '@/_services';
import { useLicenseStore } from '@/_stores/licenseStore';

const initialState = {
  featureAccess: null,
};

export const createEditorLicenseSlice = (set) => ({
  ...initialState,
  updateFeatureAccess: () => {
    // Layout's useLicenseStore.fetchFeatureAccess already fetches /api/license/access
    // on mount and populates the cache. Reuse it to avoid a duplicate request on
    // every app open. Falls back to a real fetch if the cache hasn't hydrated yet
    // (e.g., AppBuilder mounted before Layout's effect resolved).
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
