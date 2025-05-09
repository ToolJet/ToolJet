import { licenseService } from '@/_services';

const initialState = {
  featureAccess: null,
};

export const createEditorLicenseSlice = (set) => ({
  ...initialState,
  updateFeatureAccess: () => {
    licenseService.getFeatureAccess().then((data) => {
      set({ featureAccess: data });
    });
  },
});
