import { getMouseDistanceFromParentDiv } from '../gridUtils';

/**
 * Computes the final (left, top) position for a dragged widget based on grid snapping and drop conditions.
 *
 * @param {Object} event - Drag event object containing movement data.
 * @param {DropAreaEntity} target - The target drop area entity (where widget is dropped).
 * @param {boolean} isParentChangeAllowed - Whether the widget can move to the target.
 * @param {number} gridWidth - The width of the grid for alignment.
 * @param {DragEntity} dragged - The entity being dragged.
 * @returns {Object} { left, top } - The computed position.
 */
export const getAdjustedDropPosition = (event, target, isParentChangeAllowed, gridWidth, dragged) => {
  let left = event.lastEvent?.translate[0];
  let top = event.lastEvent?.translate[1];

  if (isParentChangeAllowed) {
    // Compute relative position inside the new container
    const { left: adjustedLeft, top: adjustedTop } = getMouseDistanceFromParentDiv(
      event,
      target.slotId,
      target.widgetType
    );

    return {
      left: Math.round(adjustedLeft / gridWidth) * gridWidth,
      top: Math.round(adjustedTop / 10) * 10,
    };
  }

  // If movement is restricted, revert to original position
  return {
    left: dragged.left * gridWidth,
    top: dragged.top,
  };
};
