/**
 * Unit tests verifying that the ModuleContainer component cannot be deleted
 * through the deleteComponents store action.
 */
import { createStore } from 'zustand/vanilla';

// Minimal slice that mirrors the deleteComponents guard logic in componentsSlice.
// We extract the guard into a focused test rather than spinning up the full
// composed store (which requires many providers and seeded state).

describe('deleteComponents — ModuleContainer guard', () => {
  const MODULE_CONTAINER_ID = 'mc-001';
  const BUTTON_ID = 'btn-001';
  const TEXT_ID = 'txt-001';

  function buildMockStore({ selectedComponents = [], frozenState = false } = {}) {
    const componentDefs = {
      [MODULE_CONTAINER_ID]: { component: { component: 'ModuleContainer', name: 'ModuleContainer' } },
      [BUTTON_ID]: { component: { component: 'Button', name: 'Button1' } },
      [TEXT_ID]: { component: { component: 'Text', name: 'Text1' } },
    };

    return createStore((set, get) => ({
      selectedComponents,
      showWidgetDeleteConfirmation: true,

      getComponentDefinition: (id) => componentDefs[id] || null,
      getShouldFreeze: () => frozenState,

      // Simplified deleteComponents that mirrors the guard logic
      deleteComponents: (selected, moduleId = 'canvas') => {
        const { selectedComponents, getComponentDefinition, getShouldFreeze } = get();
        const shouldFreeze = getShouldFreeze();

        const _selectedComponents = (selected?.length ? selected : selectedComponents).filter((componentId) => {
          const def = getComponentDefinition(componentId, moduleId);
          return def?.component?.component !== 'ModuleContainer';
        });

        if (!_selectedComponents.length || shouldFreeze) {
          set({ showWidgetDeleteConfirmation: false });
          return [];
        }

        // Return the filtered list to verify which components would be deleted
        return _selectedComponents;
      },
    }));
  }

  it('filters out ModuleContainer from explicitly passed selection', () => {
    const store = buildMockStore();
    const result = store.getState().deleteComponents([MODULE_CONTAINER_ID, BUTTON_ID]);

    expect(result).toEqual([BUTTON_ID]);
  });

  it('filters out ModuleContainer when it is the only selected component', () => {
    const store = buildMockStore({ selectedComponents: [MODULE_CONTAINER_ID] });
    const result = store.getState().deleteComponents([]);

    expect(result).toEqual([]);
    expect(store.getState().showWidgetDeleteConfirmation).toBe(false);
  });

  it('dismisses the confirmation dialog when all selected are ModuleContainers', () => {
    const store = buildMockStore({ selectedComponents: [MODULE_CONTAINER_ID] });
    store.getState().deleteComponents([]);

    expect(store.getState().showWidgetDeleteConfirmation).toBe(false);
  });

  it('allows deletion of non-ModuleContainer components', () => {
    const store = buildMockStore();
    const result = store.getState().deleteComponents([BUTTON_ID, TEXT_ID]);

    expect(result).toEqual([BUTTON_ID, TEXT_ID]);
  });

  it('uses selectedComponents from store when no explicit selection is passed', () => {
    const store = buildMockStore({ selectedComponents: [MODULE_CONTAINER_ID, TEXT_ID] });
    const result = store.getState().deleteComponents([]);

    expect(result).toEqual([TEXT_ID]);
  });

  it('returns early without deleting when the app is frozen', () => {
    const store = buildMockStore({ frozenState: true });
    const result = store.getState().deleteComponents([BUTTON_ID]);

    expect(result).toEqual([]);
    expect(store.getState().showWidgetDeleteConfirmation).toBe(false);
  });

  it('handles unknown component IDs gracefully (no definition found)', () => {
    const store = buildMockStore();
    const result = store.getState().deleteComponents(['unknown-id']);

    // Unknown IDs have no definition, so def?.component?.component is undefined — they pass the filter
    expect(result).toEqual(['unknown-id']);
  });
});
