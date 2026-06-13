import { licenseService } from '@/_services/license.service';

const initialState = {
  user: {},
};

export const createUserSlice = (set) => ({
  ...initialState,
  setUser: (user) => set(() => ({ user }), false, 'setUser'),
  updateFeatureAccess: () => {
    licenseService.getFeatureAccess().then((data) => {
      set({ featureAccess: data });
    });
  },
});
