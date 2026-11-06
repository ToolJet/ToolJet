/**
 * Which widgets a drop target refuses.
 *
 * The restriction table is keyed by the name a drop target goes by in the config, which is not
 * always the widget's own type — a Kanban's drop area is a card. `getParentWidgetFromId` is the
 * shared translation, and the store's paste path already uses it.
 */
import { isDroppingRestrictedWidget } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import { DropAreaEntity, DragEntity } from '@/AppBuilder/AppCanvas/Grid/helpers/dragEnd';

const KANBAN_ID = 'kanban-0000-0000-0000-000000000000';

const dropArea = (widgetType, slotId) =>
  new DropAreaEntity({ id: slotId.slice(0, 36), component: { component: widgetType } }, slotId);
const dragging = (widgetType) => new DragEntity({ id: 'dragged-1', component: { component: widgetType } });

describe('Restricted drop targets', () => {
  test('[Listview-BUG-026] a Kanban card refuses a List View', () => {
    // Break this catches: reading the restriction table with the raw target type 'Kanban', while the
    // table keys the card as 'Kanban_card' — the lookup misses, the list is empty, everything passes.
    expect(isDroppingRestrictedWidget(dropArea('Kanban', KANBAN_ID), dragging('Listview'))).toBe(true);
  });

  test('[Listview-BUG-026] a Kanban card still accepts a widget it never refused', () => {
    // Guard, not a bug: the fix must not turn the card into a target that refuses everything.
    expect(isDroppingRestrictedWidget(dropArea('Kanban', KANBAN_ID), dragging('Button'))).toBe(false);
  });
});
