import { DropAreaEntity } from './DropAreaEntity';

/**
 * Utility to get a widget by ID from widget list.
 */
export function getWidgetById(widgetList, id) {
  return widgetList.find((w) => w.id === id) || null;
}

/**
 * Extracts a slot ID from a DOM element.
 */
export const extractSlotId = (element) => {
  return element?.getAttribute('component-id') || element.id.replace(/^canvas-/, '');
};

/**
 * Finds the nearest valid droppable slot from a drag event location.
 */
export const getDroppableSlotIdOnScreen = (event, widgets) => {
  const [slotId] = document
    .elementsFromPoint(event.clientX, event.clientY)
    .filter(
      (ele) =>
        !event.target.contains(ele) && ele.id !== event.target.id && ele.classList.contains('drag-container-parent')
    )
    .map((ele) => extractSlotId(ele))
    .filter((slotId) => {
      const widgetType = getWidgetById(widgets, slotId.slice(0, 36))?.component?.component || 'canvas';
      return DropAreaEntity.dropAreaWidgets.includes(widgetType);
    });

  return slotId;
};
