import { licenseService } from '@/_services';
import _ from 'lodash';

const initialState = {
  license: {},
};

export const createLicenseSlice = (set, get) => ({
  ...initialState,
  updateFeatureAccess: () => {
    licenseService.getFeatureAccess().then((data) => {
      set((state) => {
        state.license = {
          featureAccess: data,
        };
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
});
