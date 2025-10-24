import { create, zustandDevTools } from './utils';
import { appVersionService } from '@/_services';
import { toast } from 'react-hot-toast';

const initialState = {
  versions: [],
  environments: [],
  draftVersion: null,
  searchQuery: '',
  selectedEnvironment: null,
  isDropdownOpen: false,
  loading: false,
  error: null,
  retryCount: 0,
};

export const useVersionManagerStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,

      // Computed/derived state
      filteredVersions: [],

      // Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        get()._filterVersionsByEnvironmentAndSearch();
      },

      setSelectedEnvironment: (env) => {
        set({ selectedEnvironment: env });
        get()._filterVersionsByEnvironmentAndSearch();
      },

      // Filter versions based on environment and search query
      _filterVersionsByEnvironmentAndSearch: () => {
        const { versions, selectedEnvironment, searchQuery } = get();

        let filtered = versions;

        // Filter by environment
        if (selectedEnvironment) {
          const envPriority = selectedEnvironment.priority;

          filtered = versions.filter((version) => {
            // Find the environment this version belongs to
            const versionEnvPriority = version.currentEnvironmentId
              ? get().environments?.find((e) => e.id === version.currentEnvironmentId)?.priority || 1
              : 1;

            // Show version if its environment priority is >= selected environment priority
            // e.g., if we're in staging (priority 2), show staging and production versions
            // if we're in production (priority 3), show only production versions
            return versionEnvPriority >= envPriority;
          });
        }

        // Filter by search query
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

      // Set environments (should be called from parent component)
      setEnvironments: (environments) => {
        set({ environments });
        get()._filterVersionsByEnvironmentAndSearch();
      },

      // Fetch all versions for an app with retry
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

      // Create a new draft version
      createDraftVersion: async (appId, payload) => {
        const { versionFromId, environmentId, versionDescription } = payload;
        set({ loading: true, error: null });

        try {
          const response = await appVersionService.createDraftVersion(appId, {
            versionFromId,
            environmentId,
            versionDescription,
          });

          // Refresh versions list
          await get().fetchVersions(appId);

          set({ loading: false });
          toast.success('Draft version created successfully');
          return response;
        } catch (error) {
          console.error('Failed to create draft version:', error);
          set({ error: error.message, loading: false });

          // Handle specific error for existing draft
          if (error.message?.includes('draft version already exists')) {
            toast.error('A draft version already exists. Please promote it first.');
          } else {
            toast.error(error.message || 'Failed to create draft version');
          }
          throw error;
        }
      },

      // Promote draft to regular version (convert isDraft to false)
      promoteVersion: async (appId, versionId, payload) => {
        const { versionName, versionDescription, environmentId } = payload;
        set({ loading: true, error: null });

        try {
          const response = await appVersionService.create(appId, {
            versionId, // This is the draft version ID to promote
            versionName,
            versionDescription,
            environmentId,
          });

          // Refresh versions list
          await get().fetchVersions(appId);

          set({ loading: false });
          toast.success(`Version ${versionName} created successfully`);
          return response;
        } catch (error) {
          console.error('Failed to promote version:', error);
          set({ error: error.message, loading: false });
          toast.error(error.message || 'Failed to create version');
          throw error;
        }
      },

      // Release a version to an environment
      releaseVersion: async (appId, versionId, environmentId) => {
        set({ loading: true, error: null });

        try {
          const response = await appVersionService.releaseVersion(appId, versionId, {
            environmentId,
          });

          // Refresh versions list
          await get().fetchVersions(appId);

          set({ loading: false });
          toast.success('Version released successfully');
          return response;
        } catch (error) {
          console.error('Failed to release version:', error);
          set({ error: error.message, loading: false });
          toast.error(error.message || 'Failed to release version');
          throw error;
        }
      },

      // Clear draft version (after promotion)
      clearDraft: () => {
        set({ draftVersion: null });
      },

      // Reset state
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'Version Manager Store' }
  )
);
