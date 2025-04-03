import { DropAreaEntity } from './DropAreaEntity';
import { getWidgetById } from './contextUtils';

/**
 * Shared base class between single-widget and group-widget drag context.
 */

const WIDGET_ID_LENGTH = 36;
export class BaseDragContext {
  constructor({ sourceSlotId, targetSlotId, widgets }) {
    const sourceWidgetId = sourceSlotId?.slice(0, WIDGET_ID_LENGTH);
    const targetWidgetId = targetSlotId?.slice(0, WIDGET_ID_LENGTH);

    const sourceWidget = getWidgetById(widgets, sourceWidgetId);
    const targetWidget = getWidgetById(widgets, targetWidgetId);

    this.widgets = widgets;
    this.source = new DropAreaEntity(sourceWidget, sourceSlotId);
    this.target = new DropAreaEntity(targetWidget, targetSlotId);
  }

  updateTarget(targetSlotId) {
    const targetWidgetId = targetSlotId?.slice(0, WIDGET_ID_LENGTH);
    const targetWidget = getWidgetById(this.widgets, targetWidgetId);
    this.target = new DropAreaEntity(targetWidget, targetSlotId);
  }
}
