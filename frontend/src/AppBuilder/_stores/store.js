import { create, zustandDevTools } from './utils';
import { immer } from 'zustand/middleware/immer';
import { createUserSlice } from './slices/userSlice';
import { createOrganizationSlice } from './slices/organizationSlice';
import { createAppSlice } from './slices/appSlice';
import { createLoaderSlice } from './slices/loaderSlice';
import { createLeftSideBarSlice } from './slices/leftSideBarSlice';
import { createComponentsSlice } from './slices/componentsSlice';
import { createRightSideBarSlice } from './slices/rightSideBarSlice';
import { createModeSlice } from './slices/modeSlice';
import { createQueryPanelSlice } from './slices/queryPanelSlice';
import { createDataQuerySlice } from './slices/dataQuerySlice';
import { createDataSourceSlice } from './slices/dataSourceSlice';
import { createUndoRedoSlice } from './slices/undoRedoSlice';
import { createLayoutSlice } from './slices/layoutSlice';
import { createResolvedSlice } from './slices/resolvedSlice';
import { createEnvironmentsAndVersionsSlice } from './slices/environmentsAndVersionsSlice';
import { createEditorLicenseSlice } from './slices/editorLicenseSlice';
import { createAppVersionSlice } from './slices/appVersionSlice';
import { createPageMenuSlice } from './slices/pageMenuSlice';
import { createLicenseSlice } from './slices/licenseSlice';
import { createDependencySlice } from './slices/dependencySlice';
import { createGridSlice } from './slices/gridSlice';
import { createEventsSlice } from './slices/eventsSlice';
import { createMultiplayerSlice } from './slices/multiplayerSlice';
import { createCodeHinterSlice } from './slices/codeHinterSlice';
import { createDebuggerSlice } from './slices/debuggerSlice';
import { createGitSyncSlice } from './slices/gitSyncSlice';
import { createAiSlice } from './slices/aiSlice';
import { createFixWithAiSlice } from './slices/fixWithAi';
import { createWhiteLabellingSlice } from './slices/whiteLabellingSlice';
import { createFormComponentSlice } from './slices/formComponentSlice';
import { createInspectorSlice } from './slices/inspectorSlice';
import { createModuleSlice } from './slices/moduleSlice';

// Memory leak prevention: Store cleanup registry
const storeCleanupRegistry = new Set();

const createMemorySafeStore = () => {
  const store = create(
    zustandDevTools(
      immer((...state) => ({
        ...createUserSlice(...state),
        ...createOrganizationSlice(...state),
        ...createAppSlice(...state),
        ...createLoaderSlice(...state),
        ...createLeftSideBarSlice(...state),
        ...createComponentsSlice(...state),
        ...createRightSideBarSlice(...state),
        ...createModeSlice(...state),
        ...createQueryPanelSlice(...state),
        ...createDataSourceSlice(...state),
        ...createDataQuerySlice(...state),
        ...createUndoRedoSlice(...state),
        ...createResolvedSlice(...state),
        ...createLayoutSlice(...state),
        ...createEnvironmentsAndVersionsSlice(...state),
        // ...createEditorLicenseSlice(...state),
        ...createAppVersionSlice(...state),
        ...createPageMenuSlice(...state),
        ...createLicenseSlice(...state),
        ...createDependencySlice(...state),
        ...createGridSlice(...state),
        ...createEventsSlice(...state),
        ...createMultiplayerSlice(...state),
        ...createCodeHinterSlice(...state),
        ...createDebuggerSlice(...state),
        ...createGitSyncSlice(...state),
        ...createAiSlice(...state),
        ...createFixWithAiSlice(...state),
        ...createWhiteLabellingSlice(...state),
        ...createFormComponentSlice(...state),
        ...createInspectorSlice(...state),
        ...createModuleSlice(...state),

        // Memory management methods
        cleanUpStore: (force = false) => {
          console.log('🧹 Cleaning up store...');

          // Clean up each slice
          const get = state[0];
          const set = state[1];

          try {
            // Clean up components architecture
            if (get().cleanupArchitecture) {
              get().cleanupArchitecture('canvas');
            }

            // Clean up subscriptions in registry
            storeCleanupRegistry.forEach(cleanup => {
              try {
                cleanup();
              } catch (error) {
                console.warn('Store cleanup error:', error);
              }
            });

            if (force) {
              // Reset critical state to prevent memory leaks
              set(state => {
                state.components = {};
                state.resolvedComponents = {};
                state._architecture = {};
                state.currentState = {};
                state.queries = {};
                state.events = [];
              }, false, 'forceCleanup');
            }

            console.log('🧹 Store cleanup completed');
          } catch (error) {
            console.error('Store cleanup failed:', error);
          }
        },

        // Register cleanup function
        registerCleanup: (cleanupFn) => {
          if (typeof cleanupFn === 'function') {
            storeCleanupRegistry.add(cleanupFn);
            return () => storeCleanupRegistry.delete(cleanupFn);
          }
        }
      })),
      { name: 'App Builder Store', anonymousActionType: 'unknown' }
    )
  );

  // Register global cleanup
  if (typeof window !== 'undefined') {
    if (window.memoryLeakDetector) {
      window.memoryLeakDetector.registerComponentCleanup('tooljet-store', () => {
        store.getState().cleanUpStore(true);
      });
    }

    // Cleanup on page unload
    const handleUnload = () => {
      store.getState().cleanUpStore(true);
    };

    window.addEventListener('beforeunload', handleUnload);
    storeCleanupRegistry.add(() => {
      window.removeEventListener('beforeunload', handleUnload);
    });
  }

  return store;
};

export default createMemorySafeStore();
