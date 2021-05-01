import React from 'react';
import { useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { BoxDragPreview } from './BoxDragPreview';
import { snapToGrid } from './snapToGrid';
const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%'
};

function getItemStyles(delta, item, initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none'
    };
  }
  let { x, y } = currentOffset;

  let id = item.id;

  const canvasContainerBoundingRect = document.getElementsByClassName('canvas-container')[0].getBoundingClientRect();
  const realCanvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

  const realCanvasDelta = realCanvasBoundingRect.x - canvasContainerBoundingRect.x;

  if (id) { // Dragging within the canvas
    x = Math.round(item.left + delta.x);
    y = Math.round(item.top + delta.y);
  } else { // New component being dragged  from components sidebar
    const offsetFromTopOfWindow = realCanvasBoundingRect.top;
    const offsetFromLeftOfWindow = realCanvasBoundingRect.left;
    const zoomLevel = item.zoomLevel;

    x = Math.round(currentOffset.x + (currentOffset.x * (1 - zoomLevel)) - offsetFromLeftOfWindow);
    y = Math.round(currentOffset.y + (currentOffset.y * (1 - zoomLevel)) - offsetFromTopOfWindow);
  }

  [x, y] = snapToGrid(x, y);

  x += realCanvasDelta;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform
  };
}
export const CustomDragLayer = () => {
  const {
    itemType, isDragging, item, initialOffset, currentOffset, delta
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
    delta: monitor.getDifferenceFromInitialOffset()
  }));
  function renderItem() {
    switch (itemType) {
      case ItemTypes.BOX:
        return <BoxDragPreview item={item} />;
      default:
        return null;
    }
  }
  if (!isDragging) {
    return null;
  }
  return (
    <div style={layerStyles}>
      <div style={getItemStyles(delta, item, initialOffset, currentOffset)}>
        {renderItem()}
      </div>
    </div>
  );
};
