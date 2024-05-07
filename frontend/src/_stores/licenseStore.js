import { create, zustandDevTools } from './utils';
import { licenseService } from '@/_services';
import { shallow } from 'zustand/shallow';

const initialState = {
  featureAccess: {},
  featuresLoaded: false,
};

export const useLicenseStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        fetchFeatureAccess: () => {
          licenseService.getFeatureAccess().then((data) => {
            set({ featureAccess: data, featuresLoaded: true });
          });
        },
      },
    }),
    { name: 'License Store' }
  )
);

export const useLicenseState = () => useLicenseStore((state) => state, shallow);
