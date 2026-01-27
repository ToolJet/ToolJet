/**
 * UI Store
 *
 * A new Zustand store specifically for UI-only state and the view model
 * that mirrors the worker's state.
 *
 * This store is divided into two sections:
 * 1. UI State (Main Thread Owned): State that is only relevant to the UI
 *    - selectedComponents, hoveredComponent, currentMode, etc.
 * 2. View Model (Mirrored from Worker): Read-only mirror of worker state
 *    - exposedValues, resolved components, container children, etc.
 *
 * The applyOperations action is used to update the view model based on
 * operations received from the worker.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

/**
 * Helper to set a nested value using a dot-notation path
 * @param {object} obj - Object to update
 * @param {string} path - Dot-notation path (e.g., "components.input1.value")
 * @param {*} value - Value to set
 */
function setNestedValue(obj, path, value) {
  // Handle array notation like "components.input1[3].value"
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');

  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      // Determine if next part is a number (array index)
      const nextPart = parts[i + 1];
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Helper to get a nested value using a dot-notation path
 * @param {object} obj - Object to read from
 * @param {string} path - Dot-notation path
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');

  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Create the initial state
 */
function createInitialState() {
  return {
    // ═══════════════════════════════════════════════════════════════════════
    // UI STATE (Main Thread Owned)
    // ═══════════════════════════════════════════════════════════════════════

    // Selection state
    selectedComponents: [],
    hoveredComponent: null,
    focusedComponent: null,

    // Mode and layout
    currentMode: 'edit', // 'edit' | 'view'
    currentLayout: 'desktop', // 'desktop' | 'mobile'

    // Panel states
    panelStates: {
      leftSidebar: true,
      rightSidebar: true,
      queryPanelHeight: 250,
    },

    // Drag state
    dragState: {
      draggingComponentId: null,
      draggingComponentType: null,
      dropTargetId: null,
      temporaryLayouts: {},
    },

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW MODEL (Mirrored from Worker)
    // ═══════════════════════════════════════════════════════════════════════

    viewModel: {
      // Exposed values - full mirror for recovery capability
      exposedValues: {
        components: {}, // { [componentId]: { value, isLoading, ... } | { [index]: { value, ... } } }
        queries: {}, // { [queryId]: { data, isLoading, error } }
        variables: {}, // { [varName]: value }
        constants: {},
        globals: {}, // { currentUser, theme, ... }
        page: {
          handle: '',
          variables: {},
        },
      },

      // Resolved components - only visible/needed components
      resolved: {
        // { [componentId]: { properties, styles, validation } }
        // For ListView children: { [componentId]: { [index]: { properties, styles } } }
      },

      // Container children mappings
      containerChildren: {
        // { [containerId]: [childId1, childId2, ...] }
      },

      // Query states
      queryStates: {
        // { [queryId]: { isLoading, isFetching, error } }
      },

      // Validation errors
      validationErrors: {
        // { [componentId]: [{ field, message }] }
      },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WORKER STATE
    // ═══════════════════════════════════════════════════════════════════════

    workerState: {
      isReady: false,
      isInitializing: false,
      error: null,
    },
  };
}

/**
 * Create the UI store
 */
const useUIStore = create(
  immer((set, get) => ({
    ...createInitialState(),

    // ═══════════════════════════════════════════════════════════════════════
    // UI STATE ACTIONS (direct mutations, no worker involved)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Set selected components
     * @param {string[]} ids - Array of component IDs
     */
    setSelectedComponents: (ids) =>
      set((state) => {
        state.selectedComponents = ids;
      }),

    /**
     * Add to selected components
     * @param {string} id - Component ID to add
     */
    addSelectedComponent: (id) =>
      set((state) => {
        if (!state.selectedComponents.includes(id)) {
          state.selectedComponents.push(id);
        }
      }),

    /**
     * Remove from selected components
     * @param {string} id - Component ID to remove
     */
    removeSelectedComponent: (id) =>
      set((state) => {
        const index = state.selectedComponents.indexOf(id);
        if (index !== -1) {
          state.selectedComponents.splice(index, 1);
        }
      }),

    /**
     * Clear selected components
     */
    clearSelectedComponents: () =>
      set((state) => {
        state.selectedComponents = [];
      }),

    /**
     * Set hovered component
     * @param {string|null} id - Component ID or null
     */
    setHoveredComponent: (id) =>
      set((state) => {
        state.hoveredComponent = id;
      }),

    /**
     * Set focused component
     * @param {string|null} id - Component ID or null
     */
    setFocusedComponent: (id) =>
      set((state) => {
        state.focusedComponent = id;
      }),

    /**
     * Set current mode
     * @param {'edit'|'view'} mode - Mode
     */
    setCurrentMode: (mode) =>
      set((state) => {
        state.currentMode = mode;
      }),

    /**
     * Set current layout
     * @param {'desktop'|'mobile'} layout - Layout
     */
    setCurrentLayout: (layout) =>
      set((state) => {
        state.currentLayout = layout;
      }),

    /**
     * Toggle current layout
     */
    toggleCurrentLayout: () =>
      set((state) => {
        state.currentLayout = state.currentLayout === 'desktop' ? 'mobile' : 'desktop';
      }),

    /**
     * Set panel state
     * @param {string} panel - Panel name
     * @param {*} value - Panel state value
     */
    setPanelState: (panel, value) =>
      set((state) => {
        state.panelStates[panel] = value;
      }),

    /**
     * Toggle panel visibility
     * @param {string} panel - Panel name
     */
    togglePanel: (panel) =>
      set((state) => {
        state.panelStates[panel] = !state.panelStates[panel];
      }),

    /**
     * Set drag state
     * @param {object} dragState - Partial drag state to merge
     */
    setDragState: (dragState) =>
      set((state) => {
        Object.assign(state.dragState, dragState);
      }),

    /**
     * Clear drag state
     */
    clearDragState: () =>
      set((state) => {
        state.dragState = {
          draggingComponentId: null,
          draggingComponentType: null,
          dropTargetId: null,
          temporaryLayouts: {},
        };
      }),

    /**
     * Set temporary layout during drag
     * @param {string} componentId - Component ID
     * @param {object} layout - Temporary layout
     */
    setTemporaryLayout: (componentId, layout) =>
      set((state) => {
        state.dragState.temporaryLayouts[componentId] = layout;
      }),

    /**
     * Clear temporary layout
     * @param {string} componentId - Component ID
     */
    clearTemporaryLayout: (componentId) =>
      set((state) => {
        delete state.dragState.temporaryLayouts[componentId];
      }),

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW MODEL ACTIONS (called by WorkerManager when applying ops)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Apply operations from the worker
     * @param {object[]} ops - Array of operations
     */
    applyOperations: (ops) =>
      set((state) => {
        console.log('[UIStore] applyOperations called with', ops.length, 'ops:', ops.map(o => o.type));
        for (const op of ops) {
          switch (op.type) {
            case 'SET_EXPOSED':
              console.log('[UIStore] SET_EXPOSED:', op.path, op.value);
              setNestedValue(state.viewModel.exposedValues, op.path, op.value);
              break;

            case 'SET_EXPOSED_FULL':
              state.viewModel.exposedValues = op.exposedValues;
              break;

            case 'SET_RESOLVED':
              console.log('[UIStore] SET_RESOLVED:', op.componentId, op.resolved);
              if (op.index !== undefined) {
                if (!state.viewModel.resolved[op.componentId]) {
                  state.viewModel.resolved[op.componentId] = {};
                }
                state.viewModel.resolved[op.componentId][op.index] = op.resolved;
              } else {
                state.viewModel.resolved[op.componentId] = op.resolved;
              }
              console.log('[UIStore] viewModel.resolved is now:', { ...state.viewModel.resolved });
              break;

            case 'DELETE_RESOLVED':
              delete state.viewModel.resolved[op.componentId];
              break;

            case 'SET_CHILDREN':
              state.viewModel.containerChildren[op.containerId] = op.childIds;
              break;

            case 'SET_QUERY_STATE':
              state.viewModel.queryStates[op.queryId] = op.state;
              break;

            case 'SET_VALIDATION':
              state.viewModel.validationErrors[op.componentId] = op.errors;
              break;

            default:
              console.warn('[UIStore] Unknown operation type:', op.type);
          }
        }
      }),

    /**
     * Set worker state
     * @param {object} workerState - Worker state to merge
     */
    setWorkerState: (workerState) =>
      set((state) => {
        Object.assign(state.workerState, workerState);
      }),

    // ═══════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get resolved component
     * @param {string} componentId - Component ID
     * @param {number|undefined} index - Subcontainer index
     * @returns {object|undefined} Resolved component
     */
    getResolvedComponent: (componentId, index) => {
      const resolved = get().viewModel.resolved[componentId];
      if (index !== undefined && resolved) {
        return resolved[index];
      }
      return resolved;
    },

    /**
     * Get exposed value
     * @param {string} entityType - 'components', 'queries', 'variables', 'globals', 'page'
     * @param {string} entityId - Entity ID
     * @param {string} key - Property key (optional)
     * @returns {*} Exposed value
     */
    getExposedValue: (entityType, entityId, key) => {
      const entity = get().viewModel.exposedValues[entityType]?.[entityId];
      return key ? entity?.[key] : entity;
    },

    /**
     * Get container children
     * @param {string} containerId - Container ID
     * @returns {string[]} Array of child component IDs
     */
    getContainerChildren: (containerId) => {
      return get().viewModel.containerChildren[containerId] || [];
    },

    /**
     * Get query state
     * @param {string} queryId - Query ID
     * @returns {object} Query state
     */
    getQueryState: (queryId) => {
      return get().viewModel.queryStates[queryId];
    },

    /**
     * Get validation errors for a component
     * @param {string} componentId - Component ID
     * @returns {object[]} Validation errors
     */
    getValidationErrors: (componentId) => {
      return get().viewModel.validationErrors[componentId] || [];
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Reset the store to initial state
     */
    reset: () => set(createInitialState()),

    /**
     * Reset only the view model
     */
    resetViewModel: () =>
      set((state) => {
        state.viewModel = {
          exposedValues: {
            components: {},
            queries: {},
            variables: {},
            constants: {},
            globals: {},
            page: {
              handle: '',
              variables: {},
            },
          },
          resolved: {},
          containerChildren: {},
          queryStates: {},
          validationErrors: {},
        };
      }),
  }))
);

export default useUIStore;
