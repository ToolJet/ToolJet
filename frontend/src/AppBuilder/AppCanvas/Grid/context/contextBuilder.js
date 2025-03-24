import { DragContext } from './DragContext';
import { GroupDragContext } from './GroupDragContext';
import { getDroppableSlotIdOnScreen } from './contextUtils';

/**
 * Constructs DragContext for a single drag event.
 */
export function dragContextBuilder({ event, widgets }) {
  const draggedWidgetId = event.target.id;
  const draggedWidget = widgets.find((w) => w.id === draggedWidgetId);
  const sourceSlotId = draggedWidget.parent;

  const context = new DragContext({
    widgets,
    draggedWidgetId,
    sourceSlotId,
    targetSlotId: sourceSlotId,
  });

  const targetSlotId = getDroppableSlotIdOnScreen(event, widgets);
  context.updateTarget(targetSlotId);

  return context;
}

/**
 * Constructs GroupDragContext for a multi-widget drag event.
 */
export function groupDragContextBuilder({ events, widgets }) {
  const draggedWidgets = widgets.filter(({ id }) => events.some((ev) => ev.target.id === id));
  const sourceSlotId = draggedWidgets[0]?.parent;

  const context = new GroupDragContext({
    widgets,
    draggedWidgets,
    sourceSlotId,
    targetSlotId: sourceSlotId,
  });

  const targetSlotId = getDroppableSlotIdOnScreen(events[0], widgets);
  context.updateTarget(targetSlotId);

  return context;
}
