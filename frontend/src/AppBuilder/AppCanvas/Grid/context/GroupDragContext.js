import { BaseDragContext } from './BaseDragContext';
import { DragEntity } from './DragEntity';
import {
  RESTRICTED_WIDGETS_CONFIG,
  RESTRICTED_WIDGET_SLOTS_CONFIG,
} from '@/AppBuilder/WidgetManager/configs/restrictedWidgetsConfig';

/**
 * Context class for multi-widget (group) drag operations.
 */
export class GroupDragContext extends BaseDragContext {
  constructor({ sourceSlotId, targetSlotId, draggedWidgets, widgets }) {
    super({ sourceSlotId, targetSlotId, widgets });

    this.draggedEntities = draggedWidgets.map((widget) => new DragEntity(widget));
  }

  /**
   * Returns an array of restricted widget types that cannot be dropped.
   */
  get restrictedWidgetsTobeDropped() {
    const restrictedWidgets = [
      ...(RESTRICTED_WIDGETS_CONFIG?.[this.target.widgetType] || []),
      ...(RESTRICTED_WIDGET_SLOTS_CONFIG?.[this.target.slotType] || []),
    ];

    return this.draggedEntities.map((dragged) => dragged.widgetType).filter((type) => restrictedWidgets.includes(type));
  }
}
