import { create, zustandDevTools } from './utils';
import { licenseService, appsService } from '@/_services';
import { shallow } from 'zustand/shallow';

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
          // Check if user has access to modules by attempting to fetch modules
          console.log('Checking module access...');
          set({ moduleAccessLoading: true });
          appsService
            .getAll(0, '', '', 'module')
            .then(() => {
              console.log('Module access granted');
              set({ hasModuleAccess: true, moduleAccessLoading: false });
            })
            .catch((error) => {
              console.log('Module access check failed:', error);
              if (error?.statusCode === 403) {
                console.log('Module access denied (403)');
                set({ hasModuleAccess: false, moduleAccessLoading: false });
              } else if (error?.statusCode >= 500 || error?.statusCode === 404) {
                // Server errors (500+) and 404 should deny access for safety
                console.log('Module access denied (server error)');
                set({ hasModuleAccess: false, moduleAccessLoading: false });
              } else {
                // For network errors (like 0, 408, etc.), still allow access
                console.log('Module access allowed (network error)');
                set({ hasModuleAccess: true, moduleAccessLoading: false });
              }
            });
        },
      },
    }),
    { name: 'License Store' }
  )
);

export const useLicenseState = () => useLicenseStore((state) => state, shallow);
