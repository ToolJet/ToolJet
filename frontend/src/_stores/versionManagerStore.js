import { create, zustandDevTools } from './utils';
import { appVersionService } from '@/_services';
import { toast } from 'react-hot-toast';

const initialState = {
  versions: [],
  draftVersion: null,
  searchQuery: '',
  selectedEnvironmentFilter: null, // LOCAL UI state for filtering dropdown (not global selectedEnvironment)
  isDropdownOpen: false,
  loading: false,
  error: null,
  retryCount: 0,
};

export const useVersionManagerStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,

      filteredVersions: [],

      // Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get()._filterVersionsByEnvironmentAndSearch();
      },

      setSelectedEnvironmentFilter: (env) => {
        set({ selectedEnvironmentFilter: env });
        get()._filterVersionsByEnvironmentAndSearch();
      },

      // Filter versions based on search query only
      // Note: Environment filtering is handled by fetchVersionsForEnvironment which fetches
      // environment-specific versions from the backend. We don't need to filter by environment here.
      _filterVersionsByEnvironmentAndSearch: () => {
        const { versions, searchQuery } = get();

        let filtered = versions;

        // Filter out branch-type versions (only show versions with versionType === 'version')
        filtered = filtered.filter((v) => {
          const versionType = v.versionType || v.version_type;
          return versionType !== 'branch';
        });

        // Filter by search query only
        if (searchQuery) {
          filtered = filtered.filter((v) => v.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        set({ filteredVersions: filtered });
      },
      setDropdownOpen: (open) => set({ isDropdownOpen: open }),

      // Retry mechanism with exponential backoff
      _retryWithBackoff: async (fn, maxRetries = 3) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const result = await fn();
            set({ retryCount: 0 }); // Reset on success
            return result;
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            set({ retryCount: attempt + 1 });

            console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      },

      // Fetch versions for the currently selected environment (lazy loading)
      fetchVersionsForEnvironment: async (appId, environmentId) => {
        set({ loading: true, error: null });

        try {
          await get()._retryWithBackoff(async () => {
            const appEnvironmentService = (await import('@/_services')).appEnvironmentService;
            const response = await appEnvironmentService.getVersionsByEnvironment(appId, environmentId);
            const versions = response.appVersions || [];

            // Find the draft version
            const draft = versions.find((v) => v.status === 'DRAFT');

            set({
              versions,
              draftVersion: draft,
              loading: false,
            });

            // Apply filtering after setting versions
            get()._filterVersionsByEnvironmentAndSearch();
          });
        } catch (error) {
          console.error('Failed to fetch versions after retries:', error);
          set({ error: error.message || 'Failed to load versions', loading: false });
          toast.error('Failed to load versions. Please try again.');
        }
      },

      // Fetch all versions for an app with retry (used when needed)
      fetchVersions: async (appId) => {
        set({ loading: true, error: null });

        try {
          await get()._retryWithBackoff(async () => {
            const response = await appVersionService.getAll(appId);
            const versions = response.versions || response.appVersions || [];

            // Find the draft version
            const draft = versions.find((v) => v.status === 'DRAFT');

            set({
              versions,
              draftVersion: draft,
              loading: false,
            });

            // Apply filtering after setting versions
            get()._filterVersionsByEnvironmentAndSearch();
          });
        } catch (error) {
          console.error('Failed to fetch versions after retries:', error);
          set({ error: error.message || 'Failed to load versions', loading: false });
          toast.error('Failed to load versions. Please try again.');
        }
      },

      // Refresh versions after global actions
      // This is called by components after they call global store actions
      refreshVersions: async (appId, environmentId) => {
        if (environmentId) {
          await get().fetchVersionsForEnvironment(appId, environmentId);
        } else {
          await get().fetchVersions(appId);
        }
      },

      // Reset state
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'Version Manager Store' }
  )
);
