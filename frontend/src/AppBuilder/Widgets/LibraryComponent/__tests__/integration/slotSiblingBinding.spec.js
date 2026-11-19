import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';

const PACK_ID = '11111111-1111-4111-8111-111111111111';
const INPUT_ID = '22222222-2222-4222-8222-222222222222';
const TEXT_ID = '33333333-3333-4333-8333-333333333333';

const state = () => useStore.getState();

const childOf = (parent, ...args) => {
  const definition = componentDefinition(...args);
  definition.component.parent = parent;
  return definition;
};

// A pack or library component is row-scoped only for its ToolJet.RowSlot rows, whose children are parented to it
// directly. A native component in one of its named slots (parent `<componentId>-<slotName>`) is an ordinary widget:
// it reads its siblings like any other component, not through a row that never exists.
describe.each(['PackComponent', 'LibraryComponent'])('a native component in a %s slot', (type) => {
  const seed = () =>
    seedApp({
      [PACK_ID]: componentDefinition(PACK_ID, 'card1', type),
      [INPUT_ID]: childOf(`${PACK_ID}-body`, INPUT_ID, 'textinput1', 'TextInput'),
      [TEXT_ID]: childOf(`${PACK_ID}-body`, TEXT_ID, 'text1', 'Text', {
        text: binding('{{components.textinput1.value}}'),
      }),
    });

  it('is not inside a row', () => {
    seed();
    expect(state().findNearestSubcontainerAncestor(`${PACK_ID}-body`, 'canvas')).toBeNull();
  });

  it('updates when a sibling in the same slot changes', async () => {
    seed();
    state().setExposedValue(INPUT_ID, 'value', 'hello', 'canvas');
    // Dependents re-resolve a microtask after the write.
    await Promise.resolve();
    expect(state().getResolvedComponent(TEXT_ID)?.properties?.text).toBe('hello');

    state().setExposedValue(INPUT_ID, 'value', 'again', 'canvas');
    // Dependents re-resolve a microtask after the write.
    await Promise.resolve();
    expect(state().getResolvedComponent(TEXT_ID)?.properties?.text).toBe('again');
  });

  it('keeps a RowSlot row child (parented to the component itself) row-scoped', () => {
    seed();
    expect(state().findNearestSubcontainerAncestor(PACK_ID, 'canvas')).toBe(PACK_ID);
  });
});
