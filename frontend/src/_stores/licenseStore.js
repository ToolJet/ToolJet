import { create, zustandDevTools } from './utils';
import { licenseService, appsService } from '@/_services';
import { shallow } from 'zustand/shallow';
import { authenticationService } from '@/_services/authentication.service';
import { fetchEdition } from '@/modules/common/helpers/utils';

const EMPTY_PLAN_CATALOG = { plans: [], gates: {} };
const CLOSED_LIMIT_REACHED = { open: false, resource: null, limit: null, limits: null };

const initialState = {
  featureAccess: {},
  featuresLoaded: false,
  hasModuleAccess: true, // Default to true, will be updated after permission check
  moduleAccessLoading: false, // Track if module access check is in progress
  // Lowest plan that unlocks each paid feature (GET /license/plan-catalog). Static per
  // deployment, so it is fetched once per page load. CE shows no plan tags and never fetches it.
  planCatalog: EMPTY_PLAN_CATALOG,
  planCatalogStatus: 'idle', // idle | loading | loaded | error
  // Limit-reached modal (LimitReachedModal, mounted once in App.jsx).
  limitReached: CLOSED_LIMIT_REACHED,
};

// Shared by concurrent callers so a page that mounts several gates makes one request.
let planCatalogRequest = null;
let featureAccessRequest = null;

export const useLicenseStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        fetchFeatureAccess: () => {
          licenseService.getFeatureAccess().then((data) => {
            get().actions.setFeatureAccess(data);
          });
        },

        // Loads feature access once for screens that fetch their own copy and never fill the store.
        ensureFeatureAccess: () => {
          if (get().featuresLoaded) return Promise.resolve();
          if (featureAccessRequest) return featureAccessRequest;
          featureAccessRequest = licenseService
            .getFeatureAccess()
            .then((data) => get().actions.setFeatureAccess(data))
            .catch(() => {})
            .finally(() => {
              featureAccessRequest = null;
            });
          return featureAccessRequest;
        },

        // Also called by the App Builder, which fetches feature access itself and isn't
        // rendered under Layout, so plan tags there read the same data.
        setFeatureAccess: (featureAccess) => {
          set({ featureAccess: featureAccess ?? {}, featuresLoaded: true });
        },

        ensurePlanCatalog: () => {
          if (fetchEdition() === 'ce' || get().planCatalogStatus === 'loaded') return Promise.resolve();
          if (planCatalogRequest) return planCatalogRequest;

          set({ planCatalogStatus: 'loading' });
          planCatalogRequest = licenseService
            .getPlanCatalog()
            .then((planCatalog) => set({ planCatalog: planCatalog ?? EMPTY_PLAN_CATALOG, planCatalogStatus: 'loaded' }))
            .catch(() => set({ planCatalogStatus: 'error' }))
            .finally(() => {
              planCatalogRequest = null;
            });
          return planCatalogRequest;
        },

        // One limit: { resource, limit }. Several (users): { resource, limits: [{ label, limit }] }.
        openLimitReached: ({ resource, limit = null, limits = null }) => {
          set({ limitReached: { open: true, resource, limit, limits } });
        },

        closeLimitReached: () => {
          set({ limitReached: CLOSED_LIMIT_REACHED });
        },

        checkModuleAccess: () => {
          // Check if user is an end-user; if so, do not give module access
          const currentSession = authenticationService.currentSessionValue;
          if (
            !currentSession?.user_permissions?.app_create &&
            !currentSession?.super_admin &&
            !currentSession?.admin &&
            currentSession?.role?.name !== 'builder'
          ) {
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
