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
  height: '100%',
};

function getItemStyles(delta, item, initialOffset, currentOffset, currentLayout) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  let { x, y } = currentOffset;

  let id = item.id;

  const canvasContainerBoundingRect = document.getElementsByClassName('canvas-container')[0].getBoundingClientRect();
  const realCanvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

  const realCanvasDelta = realCanvasBoundingRect.x - canvasContainerBoundingRect.x;

  if (id) {
    // Dragging within the canvas

    x = Math.round(item.layouts[currentLayout].left + delta.x);
    y = Math.round(item.layouts[currentLayout].top + delta.y);
  } else {
    // New component being dragged  from components sidebar
    const offsetFromTopOfWindow = realCanvasBoundingRect.top;
    const offsetFromLeftOfWindow = realCanvasBoundingRect.left;
    const zoomLevel = item.zoomLevel;

    x = Math.round(currentOffset.x + currentOffset.x * (1 - zoomLevel) - offsetFromLeftOfWindow);
    y = Math.round(currentOffset.y + currentOffset.y * (1 - zoomLevel) - offsetFromTopOfWindow);
  }

  [x, y] = snapToGrid(x, y);

  x += realCanvasDelta;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    parent: {
      transform,
      WebkitTransform: transform,
    },
    item: {
      backgroundColor:
        x < realCanvasDelta || x + item.layouts[currentLayout].width > realCanvasBoundingRect.right ? 'red' : '#438fd7',
    },
  };
}
export const CustomDragLayer = ({ currentLayout }) => {
  const { itemType, isDragging, item, initialOffset, currentOffset, delta } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
    delta: monitor.getDifferenceFromInitialOffset(),
  }));
  function renderItem(styles) {
    switch (itemType) {
      case ItemTypes.BOX:
        return <BoxDragPreview item={item} currentLayout={currentLayout} styles={styles} />;
      default:
        return null;
    }
  }

  if (!isDragging || !item || item.parent) {
    return null;
  }

  const boxStyles = getItemStyles(delta, item, initialOffset, currentOffset, currentLayout);

  return (
    <div style={layerStyles}>
      <div style={boxStyles['parent']}>{renderItem(boxStyles['item'])}</div>
    </div>
  );
};
