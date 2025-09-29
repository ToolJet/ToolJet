import { immer } from 'zustand/middleware/immer';
import { appHistoryService } from '@/_services/appHistory.service';
import { create, zustandDevTools } from '../AppBuilder/_stores/utils';

// Initial state
const initialState = {
  historyEntries: [],
  isLoading: false,
  isRestoring: false,
  pagination: {
    page: 0,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  selectedEntry: {},
  showRenameEntryModal: false,
  showRestoreEntryModal: false,
};

const useAppHistoryStore = create(
  zustandDevTools(
    immer((set, get) => ({
      ...initialState,

      // Actions with named action types for Redux DevTools
      loadHistory: async (appVersionId, page = 0, limit = 20) => {
        set(
          (state) => {
            state.isLoading = true;
          },
          false,
          'loadHistory/start'
        );

        try {
          const response = await appHistoryService.getHistory(appVersionId, page, limit);

          set(
            (state) => {
              state.historyEntries = page === 0 ? response.entries : [...state.historyEntries, ...response.entries];
              state.pagination = response.pagination;
              state.isLoading = false;
            },
            false,
            'loadHistory/success'
          );
        } catch (error) {
          console.error('Failed to load history:', error);
          set(
            (state) => {
              state.isLoading = false;
            },
            false,
            'loadHistory/error'
          );
        }
      },

      restoreToHistory: async (appVersionId, historyId) => {
        set(
          (state) => {
            state.isRestoring = true;
          },
          false,
          'restoreToHistory/start'
        );

        try {
          const response = await appHistoryService.restoreToEntry(historyId);

          // Reload history after restoration
          await get().loadHistory(appVersionId);

          set(
            (state) => {
              state.isRestoring = false;
            },
            false,
            'restoreToHistory/success'
          );

          return response;
        } catch (error) {
          console.error('Failed to restore history:', error);
          set(
            (state) => {
              state.isRestoring = false;
            },
            false,
            'restoreToHistory/error'
          );
          throw error;
        }
      },

      updateDescription: async (historyId, description) => {
        try {
          const updatedEntry = await appHistoryService.updateDescription(historyId, { description });

          // Update local state using Immer
          set(
            (state) => {
              const entryIndex = state.historyEntries.findIndex((entry) => entry.id === historyId);
              if (entryIndex !== -1) {
                state.historyEntries[entryIndex].description = description;
              }
            },
            false,
            'updateDescription'
          );

          return updatedEntry;
        } catch (error) {
          console.error('Failed to update description:', error);
          throw error;
        }
      },

      setSelectedEntry: (entry) => {
        set(
          (state) => {
            state.selectedEntry = entry;
          },
          false,
          'setSelectedEntry'
        );
      },

      setShowRenameEntryModal: (show) => {
        set(
          (state) => {
            state.showRenameEntryModal = show;
          },
          false,
          'setShowRenameEntryModal'
        );
      },

      clearHistory: () => {
        set(
          (state) => {
            state.historyEntries = [];
            state.pagination = { page: 0, limit: 20, total: 0, hasMore: false };
          },
          false,
          'clearHistory'
        );
      },

      // SSE: Update history from server-sent events
      updateHistoryFromSSE: (historyData) => {
        set(
          (state) => {
            // Replace the history entries with fresh data from SSE
            state.historyEntries = historyData.entries || [];
            state.pagination = historyData.pagination || state.pagination;
          },
          false,
          'updateHistoryFromSSE'
        );
      },

      setShowRestoreEntryModal: (show) => {
        set(
          (state) => {
            state.showRestoreEntryModal = show;
          },
          false,
          'setShowRestoreEntryModal'
        );
      },
    })),
    {
      name: 'appHistory-store',
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
);

export default useAppHistoryStore;
