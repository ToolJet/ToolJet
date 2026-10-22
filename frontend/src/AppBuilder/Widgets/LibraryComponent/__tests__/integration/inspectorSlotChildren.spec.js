import { seedApp, componentDefinition } from '@/test/app-builder';

const CARD_ID = '11111111-1111-4111-8111-111111111111';

const childOf = (id, name, type, parent) => {
  const definition = componentDefinition(id, name, type);
  definition.component.parent = parent;
  return definition;
};

// The left sidebar's state inspector lists only root components and nests every other component under
// its container (getAllComponentChildrenById). A ToolJet.Slot child's parent is `<componentId>-<slotName>`.
describe('state inspector: components inside a library component slot', () => {
  const seed = () =>
    seedApp({
      [CARD_ID]: componentDefinition(CARD_ID, 'card1', 'LibraryComponent'),
      'btn-1': childOf('btn-1', 'button1', 'Button', `${CARD_ID}-body`),
      'input-1': childOf('input-1', 'textinput1', 'TextInput', `${CARD_ID}-tab_details`),
      'free-1': componentDefinition('free-1', 'text1', 'Text'),
    });

  it('[LibraryComponent-INSPECTOR-001] lists the components of every slot under the library component', () => {
    // Break this catches: falling through to the default `<componentId>` lookup, which finds no children
    // for a library component, so slot children vanish from the inspector (they are not roots either).
    const state = seed()();
    const nodes = state.formatInspectorComponentData(state.getComponentIdNameMapping(), {});

    expect(nodes.map((n) => n.name)).toEqual(['card1', 'text1']);
    const card = nodes.find((n) => n.name === 'card1');
    expect(card.children.map((n) => n.name).sort()).toEqual(['button1', 'textinput1']);
  });
});
