/**
 * A component inside a List view or Kanban row keeps its resolved values as an array, one entry per row. When that
 * array is still empty, a dependency update seeds the entry from DEFAULT_COMPONENT_STRUCTURE. The seed was a shallow
 * copy, so its `properties` (and the other sections) was the module-level default's own object: the first write went
 * into the shared default and the store froze it, and the next component seeded the same way threw
 * "Cannot assign to read only property". The seed is now a deep copy.
 *
 * Real store; the resolved entries are set to empty rows directly, the state a row widget leaves before its data loads.
 */
import useStore from '@/AppBuilder/_stores/store';
import { DEFAULT_COMPONENT_STRUCTURE } from '@/AppBuilder/_stores/slices/resolvedSlice';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const MODULE_ID = 'canvas';
const state = () => useStore.getState();

beforeEach(() => {
  seedApp({
    c1: componentDefinition('c1', 'text1', 'Text', { text: binding('first') }),
    c2: componentDefinition('c2', 'text2', 'Text', { text: binding('second') }),
  });
  // Each text is bound, as a real binding registers it in the dependency graph.
  state().addDependency('variables.greeting', 'components.c1.properties.text', '{{variables.greeting}}', MODULE_ID);
  state().addDependency('variables.greeting', 'components.c2.properties.text', '{{variables.greeting}}', MODULE_ID);
  // Both components sit in rows whose data has not arrived: an empty row array each.
  useStore.setState((draft) => {
    draft.resolvedStore.modules[MODULE_ID].components.c1 = [];
    draft.resolvedStore.modules[MODULE_ID].components.c2 = [];
  });
});

test('two components seeded from an empty row both take their value, without sharing the default', () => {
  expect(() => state().applyDependencyUpdate('components.c1.properties.text', '', MODULE_ID)).not.toThrow();
  expect(() => state().applyDependencyUpdate('components.c2.properties.text', '', MODULE_ID)).not.toThrow();

  const { c1, c2 } = state().resolvedStore.modules[MODULE_ID].components;
  expect(c1.properties).not.toBe(c2.properties);
  expect(c1.properties).not.toBe(DEFAULT_COMPONENT_STRUCTURE.properties);
});

test('the shared default stays empty and writable', () => {
  state().applyDependencyUpdate('components.c1.properties.text', '', MODULE_ID);
  expect(DEFAULT_COMPONENT_STRUCTURE.properties).toEqual({});
  expect(Object.isFrozen(DEFAULT_COMPONENT_STRUCTURE.properties)).toBe(false);
});
