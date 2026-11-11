import { packSlotRestrictionType, restrictedTypeOf } from '@/AppBuilder/_helpers/packDropRestrictions';
import { isDroppingRestrictedWidget } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import { DragEntity, DropAreaEntity } from '@/AppBuilder/AppCanvas/Grid/helpers/dragEnd';
import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';

// A component pack's widget is checked in the drop rules as the ToolJet widget it stands for, from its manifest role:
// every pack widget has the one type PackComponent, so a Kanban could be dropped into a pack Kanban card (QA item 23).
const MANIFESTS = {
  shadcn: {
    components: {
      Kanban: { role: 'kanban', slots: [{ name: 'card', kind: 'rows' }] },
      Calendar: { role: 'calendar' },
      Dialog: { role: 'dialog', slots: [{ name: 'body', kind: 'popup' }] },
      TabsContainer: { role: 'tabs', slots: [{ name: 'tab_details', kind: 'slot' }] },
      Tabs: { role: 'tabs' },
      Card: { role: 'card', slots: [{ name: 'body', kind: 'slot' }] },
      Input: { role: 'input' },
    },
  },
};

const pack = (componentName, packId = 'shadcn') => ({
  component: 'PackComponent',
  definition: { properties: { pack: { value: packId }, componentName: { value: componentName } } },
});
const native = (type) => ({ component: type, definition: { properties: {} } });

const KANBAN_ID = '11111111-1111-1111-1111-111111111111';
const widget = (id, component) => ({ id, component });
const dropOn = (component, slot) => new DropAreaEntity(widget(KANBAN_ID, component), `${KANBAN_ID}-${slot}`);
const dragging = (component) => new DragEntity({ ...widget('22222222-2222-2222-2222-222222222222', component) });

describe('pack widgets in the drop rules', () => {
  beforeEach(() => useBuiltinPacksStore.setState({ manifests: MANIFESTS }));
  afterEach(() => useBuiltinPacksStore.setState({ packs: null, manifests: {} }));

  it('checks a pack widget as the ToolJet widget its role stands for', () => {
    expect(restrictedTypeOf(pack('Kanban'))).toBe('Kanban');
    expect(restrictedTypeOf(pack('Calendar'))).toBe('Calendar');
    expect(restrictedTypeOf(pack('Dialog'))).toBe('ModalV2');
    expect(restrictedTypeOf(pack('TabsContainer'))).toBe('Tabs');
    expect(restrictedTypeOf(pack('Card'))).toBe('Container');
  });

  it('leaves a slot-less Tabs strip and a plain field as pack widgets, which go anywhere', () => {
    expect(restrictedTypeOf(pack('Tabs'))).toBe('PackComponent');
    expect(restrictedTypeOf(pack('Input'))).toBe('PackComponent');
  });

  it('leaves native widgets, unknown pack components and unloaded manifests as they are', () => {
    expect(restrictedTypeOf(native('Kanban'))).toBe('Kanban');
    expect(packSlotRestrictionType(native('Kanban'))).toBeUndefined();
    expect(restrictedTypeOf(pack('Nope'))).toBe('PackComponent');
    useBuiltinPacksStore.setState({ manifests: {} });
    expect(restrictedTypeOf(pack('Kanban'))).toBe('PackComponent');
  });

  it("gives a pack Kanban's cards the Kanban card rules", () => {
    expect(packSlotRestrictionType(pack('Kanban'))).toBe('Kanban_card');
    expect(packSlotRestrictionType(pack('Dialog'))).toBe('ModalV2');
  });

  // Break this catches: the drag check reading only the widget type, so a Kanban drops into a pack Kanban card.
  it('stops a Kanban, pack or ToolJet, from being dragged into a pack Kanban card', () => {
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(pack('Kanban')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(native('Kanban')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(pack('Card')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(native('Table')))).toBe(true);
  });

  it('still lets fields into a pack Kanban card', () => {
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(pack('Input')))).toBe(false);
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(native('TextInput')))).toBe(false);
    expect(isDroppingRestrictedWidget(dropOn(pack('Kanban'), 'card'), dragging(pack('Tabs')))).toBe(false);
  });

  it('applies the ToolJet rules to pack widgets dropped into ToolJet containers', () => {
    expect(isDroppingRestrictedWidget(dropOn(native('Form'), 'form'), dragging(pack('Calendar')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(native('Container'), 'container'), dragging(pack('Kanban')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(native('Container'), 'container'), dragging(pack('Input')))).toBe(false);
  });

  it('keeps a Calendar out of a pack Dialog, as out of a ToolJet one', () => {
    expect(isDroppingRestrictedWidget(dropOn(pack('Dialog'), 'body'), dragging(pack('Calendar')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(pack('Dialog'), 'body'), dragging(native('Calendar')))).toBe(true);
    expect(isDroppingRestrictedWidget(dropOn(pack('Dialog'), 'body'), dragging(native('Table')))).toBe(false);
  });
});
