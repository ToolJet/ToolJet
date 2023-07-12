import React, { useEffect } from 'react';
import { useDragLayer } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { BoxDragPreview } from './BoxDragPreview';
import { snapToGrid } from '@/_helpers/appUtils';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(delta, item, initialOffset, currentOffset, currentLayout, initialClientOffset, canvasWidth) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  let x, y;

  let id = item.id;

  const canvasContainerBoundingRect = document.getElementsByClassName('canvas-container')[0].getBoundingClientRect();
  const realCanvasBoundingRect = document.getElementsByClassName('real-canvas')[0].getBoundingClientRect();

  const realCanvasDelta = realCanvasBoundingRect.x - canvasContainerBoundingRect.x;

  if (id) {
    // Dragging within the canvas

    x = Math.round((item.layouts[currentLayout].left * canvasWidth) / 100 + delta.x);
    y = Math.round(item.layouts[currentLayout].top + delta.y);
  } else {
    // New component being dragged  from components sidebar
    const offsetFromTopOfWindow = realCanvasBoundingRect.top;
    const offsetFromLeftOfWindow = realCanvasBoundingRect.left;
    const zoomLevel = item.zoomLevel;

    x = Math.round(currentOffset.x + currentOffset.x * (1 - zoomLevel) - offsetFromLeftOfWindow);
    y = Math.round(initialClientOffset.y - 10 + delta.y + currentOffset.y * (1 - zoomLevel) - offsetFromTopOfWindow);
  }

  [x, y] = snapToGrid(canvasWidth, x, y);

  // commented to fix issue that caused the dragged element to be out of position with mouse pointer
  // x += realCanvasDelta;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
    width: 'fit-content',
  };
}
export const CustomDragLayer = ({ canvasWidth, onDragging }) => {
  const { itemType, isDragging, item, initialOffset, currentOffset, delta, initialClientOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      initialClientOffset: monitor.getInitialClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
      delta: monitor.getDifferenceFromInitialOffset(),
    })
  );
  const { currentLayout } = useEditorStore(
    (state) => ({
      currentLayout: state?.currentLayout,
    }),
    shallow
  );

  useEffect(() => {
    onDragging(isDragging);
  }, [isDragging]);

  if (itemType === ItemTypes.COMMENT) return null;
  function renderItem() {
    switch (itemType) {
      case ItemTypes.BOX:
        return <BoxDragPreview item={item} canvasWidth={canvasWidth} />;
      default:
        return null;
    }
  }

  if (!isDragging || !item || item.parent) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div
        style={getItemStyles(
          delta,
          item,
          initialOffset,
          currentOffset,
          currentLayout,
          initialClientOffset,
          canvasWidth
        )}
      >
        {renderItem()}
      </div>
    </div>
  );
};
