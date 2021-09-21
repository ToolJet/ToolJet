import React from 'react';
import { useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { BoxDragPreview } from './BoxDragPreview';
import { snapToGrid } from './snapToGrid';
const layerStyles = {
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(delta, item, initialOffset, currentOffset, parentRef, parent, currentLayout) {
  if (!initialOffset || !currentOffset || !parentRef.current) {
    return {
      display: 'none',
    };
  }

  if (parent !== item.parent) {
    return {
      display: 'none',
    };
  }

  let { x, y } = currentOffset;

  let id = item.id;

  const realCanvasBoundingRect = parentRef.current.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

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

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}
export const SubCustomDragLayer = ({ parentRef, parent, currentLayout }) => {
  const { itemType, isDragging, item, initialOffset, currentOffset, delta } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
    delta: monitor.getDifferenceFromInitialOffset(),
  }));
  function renderItem() {
    switch (itemType) {
      case ItemTypes.BOX:
        return <BoxDragPreview item={item} currentLayout={currentLayout} />;
      default:
        return null;
    }
  }
  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles} className="sub-custom-drag-layer">
      <div style={getItemStyles(delta, item, initialOffset, currentOffset, parentRef, parent, currentLayout)}>
        {renderItem()}
      </div>
    </div>
  );
};
