/**
 * deleteComponents — ModuleContainer guard (integration)
 *
 * Exercises the real deleteComponents through the composed store. The guard
 * lives in componentsSlice.js (the .filter() that calls isComponentDeletable)
 * and must survive mutation-verification: removing the filter makes both tests
 * go red.
 *
 * The pure predicate is covered separately in
 * componentsSliceUtils.isComponentDeletable.spec.js (Layer 1, no store).
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();

beforeEach(() => {
  seedApp({
    mc1: componentDefinition('mc1', 'moduleContainer1', 'ModuleContainer'),
    b1: componentDefinition('b1', 'button1', 'Button'),
  });
});

test('a ModuleContainer in the selection is skipped; siblings still delete', () => {
  state().deleteComponents(['mc1', 'b1']);
  const ids = Object.keys(state().getCurrentPageComponents('canvas'));
  expect(ids).toContain('mc1');
  expect(ids).not.toContain('b1');
});

test('selecting only the ModuleContainer deletes nothing and dismisses the dialog', () => {
  state().setSelectedComponents(['mc1']);
  state().deleteComponents([]);
  expect(Object.keys(state().getCurrentPageComponents('canvas'))).toContain('mc1');
  expect(state().showWidgetDeleteConfirmation).toBe(false);
});
