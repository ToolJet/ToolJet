import { create, zustandDevTools } from './utils';
import { licenseService, appsService } from '@/_services';
import { shallow } from 'zustand/shallow';
import { authenticationService } from '@/_services/authentication.service';

const initialState = {
  featureAccess: {},
  featuresLoaded: false,
  hasModuleAccess: true, // Default to true, will be updated after permission check
  moduleAccessLoading: false, // Track if module access check is in progress
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

        checkModuleAccess: () => {
          // Check if user is an end-user; if so, do not give module access
          const currentSession = authenticationService.currentSessionValue;
          if (!currentSession?.user_permissions?.app_create && !currentSession?.super_admin && !currentSession?.admin) {
            set({ hasModuleAccess: false, moduleAccessLoading: false });
          } else {
            set({ hasModuleAccess: true, moduleAccessLoading: false });
          }
        },
      },
    }),
    { name: 'License Store' }
  )
);

export const useLicenseState = () => useLicenseStore((state) => state, shallow);
