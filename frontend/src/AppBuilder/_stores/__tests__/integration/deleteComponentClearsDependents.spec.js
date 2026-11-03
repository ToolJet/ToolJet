/**
 * Bug: deleteComponents removes a component's own store entry and dependency
 * graph node, but never forces its dependents to recompute afterward. A
 * dependent that already resolved a binding referencing the deleted
 * component keeps showing that stale last value indefinitely, even though
 * the component it came from no longer exists.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();

describe("deleteComponents clears a dependent's stale resolved value", () => {
  test('a dependent no longer resolves the deleted component after it is removed', async () => {
    seedApp({
      c1: componentDefinition('c1', 'textinput1', 'TextInput'),
      c2: componentDefinition('c2', 'text1', 'Text', {
        text: binding('{{components.textinput1.value}}'),
      }),
    });

    state().setExposedValue('c1', 'value', 'hello');
    await Promise.resolve();
    expect(state().getResolvedComponent('c2').properties.text).toBe('hello');

    state().deleteComponents(['c1'], 'canvas', { skipFormUpdate: true, saveAfterAction: false });
    await Promise.resolve();

    // Break this catches: deleteComponents removing the dependency-graph node
    // without forcing dependents to recompute, leaving c2 showing the
    // deleted component's last value forever.
    expect(state().getResolvedComponent('c2').properties.text).not.toBe('hello');
  });
});
