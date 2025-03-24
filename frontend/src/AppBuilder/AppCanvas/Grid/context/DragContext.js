import { BaseDragContext } from './BaseDragContext';
import { DragEntity } from './DragEntity';
import {
  RESTRICTED_WIDGETS_CONFIG,
  RESTRICTED_WIDGET_SLOTS_CONFIG,
} from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';
import { getWidgetById } from './contextUtils';

/**
 * Context class for single-widget drag operations.
 */
export class DragContext extends BaseDragContext {
  constructor({ sourceSlotId, targetSlotId, draggedWidgetId, widgets }) {
    super({ sourceSlotId, targetSlotId, widgets });

    const draggedWidget = getWidgetById(widgets, draggedWidgetId);
    this.dragged = new DragEntity(draggedWidget);
  }

  get isDroppable() {
    const { dragged, target } = this;

    const restrictedWidgets = [
      ...(RESTRICTED_WIDGETS_CONFIG?.[target.widgetType] || []),
      ...(RESTRICTED_WIDGET_SLOTS_CONFIG?.[target.slotType] || []),
    ];

    return !restrictedWidgets.includes(dragged.widgetType);
  }
}
