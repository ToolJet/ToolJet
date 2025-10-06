import { immer } from 'zustand/middleware/immer';
import { appHistoryService } from '@/_services/appHistory.service';
import { create, zustandDevTools } from '../AppBuilder/_stores/utils';

// Initial state
const initialState = {
  historyEntries: [],
  isLoading: false,
  isRestoring: false,
  selectedEntry: {},
  showRenameEntryModal: false,
  showRestoreEntryModal: false,
};

const useAppHistoryStore = create(
  zustandDevTools(
    immer((set, get) => ({
      ...initialState,

      setIsLoading: async (value) => {
        set(
          (state) => {
            state.isLoading = value;
          },
          false,
          'setIsLoading'
        );
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
          },
          false,
          'clearHistory'
        );
      },

      // SSE: Update history from server-sent events
      updateHistoryFromSSE: (isInitialLoadData = false, historyData) => {
        set(
          (state) => {
            // Replace the history entries with fresh data from SSE
            state.historyEntries = historyData.entries || [];
            if (isInitialLoadData) state.isLoading = false;
          },
          false,
          'updateHistoryFromSSE'
        );
      },

      pushHistoryEntry: (newEntry) => {
        set(
          (state) => {
            state.historyEntries.unshift(newEntry);
            if (state.historyEntries.length > 100) {
              state.historyEntries.pop();
            }
          },
          false,
          'pushHistoryEntry'
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
