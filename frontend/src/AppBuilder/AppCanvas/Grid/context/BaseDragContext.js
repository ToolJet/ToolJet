import { DropAreaEntity } from './DropAreaEntity';
import { getWidgetById } from './contextUtils';

/**
 * Shared base class between single-widget and group-widget drag context.
 */
export class BaseDragContext {
  constructor({ sourceSlotId, targetSlotId, widgets }) {
    const sourceWidgetId = sourceSlotId?.slice(0, 36);
    const targetWidgetId = targetSlotId?.slice(0, 36);

    const sourceWidget = getWidgetById(widgets, sourceWidgetId);
    const targetWidget = getWidgetById(widgets, targetWidgetId);

    this.widgets = widgets;
    this.source = new DropAreaEntity(sourceWidget, sourceSlotId);
    this.target = new DropAreaEntity(targetWidget, targetSlotId);
  }

  updateTarget(targetSlotId) {
    const targetWidgetId = targetSlotId?.slice(0, 36);
    const targetWidget = getWidgetById(this.widgets, targetWidgetId);
    this.target = new DropAreaEntity(targetWidget, targetSlotId);
  }
}
