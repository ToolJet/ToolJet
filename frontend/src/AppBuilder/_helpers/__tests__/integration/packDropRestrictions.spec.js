import useStore from '@/AppBuilder/_stores/store';
import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';
import { seedApp, componentDefinition } from '@/test/app-builder';

// Pasting a widget, or dropping a new one from the Components panel, into a component pack's container runs the same
// rules as for ToolJet's containers (QA item 23): no Kanban in a pack Kanban card.
const KANBAN = '11111111-1111-1111-1111-111111111111';
const CARD = `${KANBAN}-card`;

const packProps = (componentName) => ({ pack: { value: 'shadcn' }, componentName: { value: componentName } });
const packComponent = (componentName) =>
  componentDefinition('new', 'new', 'PackComponent', packProps(componentName)).component;
const nativeComponent = (type) => componentDefinition('new', 'new', type).component;

describe('adding a widget to a pack container', () => {
  beforeEach(() => {
    useBuiltinPacksStore.setState({
      manifests: {
        shadcn: {
          components: {
            Kanban: { role: 'kanban', slots: [{ name: 'card', kind: 'rows' }] },
            Input: { role: 'input' },
          },
        },
      },
    });
    seedApp({ [KANBAN]: componentDefinition(KANBAN, 'kanban1', 'PackComponent', packProps('Kanban')) });
  });
  afterEach(() => useBuiltinPacksStore.setState({ packs: null, manifests: {} }));

  const canAdd = (component) => useStore.getState().canAddToParent(CARD, component.component, 'canvas', component);

  // Break this catches: canAddToParent reading only the types, PackComponent for both, so the paste goes through.
  it('refuses a Kanban, pack or ToolJet, in a pack Kanban card', () => {
    expect(canAdd(packComponent('Kanban'))).toBe(false);
    expect(canAdd(nativeComponent('Kanban'))).toBe(false);
    expect(canAdd(nativeComponent('Table'))).toBe(false);
  });

  it('adds fields to a pack Kanban card', () => {
    expect(canAdd(packComponent('Input'))).toBe(true);
    expect(canAdd(nativeComponent('TextInput'))).toBe(true);
  });

  it('keeps the rules for a caller that passes only the type', () => {
    expect(useStore.getState().canAddToParent(CARD, 'Kanban', 'canvas')).toBe(false);
    expect(useStore.getState().canAddToParent(CARD, 'TextInput', 'canvas')).toBe(true);
  });
});
