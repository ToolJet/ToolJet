import React, { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';
import { Resizable } from 're-resizable';

const resizerClasses = {
  topRight: 'top-right',
  bottomRight: 'bottom-right',
  bottomLeft: 'bottom-left',
  topLeft: 'top-left'
};

const resizerStyles = {
  topRight: {
    width: '12px', height: '12px', right: '-6px', top: '-6px'
  },
  bottomRight: {
    width: '12px', height: '12px', right: '-6px', bottom: '-6px'
  },
  bottomLeft: {
    width: '12px', height: '12px', left: '-6px', bottom: '-6px'
  },
  topLeft: {
    width: '12px', height: '12px', left: '-6px', top: '-6px'
  }
};

function getStyles(left, top, isDragging) {
  const transform = `translate3d(${left}px, ${top}px, 0)`;
  return {
    position: 'absolute',
    transform,
    WebkitTransform: transform,
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
    opacity: isDragging ? 0 : 1,
    height: isDragging ? 0 : ''
  };
}

export const DraggableBox = function DraggableBox({
  id,
  mode,
  title,
  left,
  top,
  width,
  height,
  component,
  index,
  inCanvas,
  onEvent,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onResizeStop,
  paramUpdated,
  resizingStatusChanged,
  zoomLevel
}) {
  const [isResizing, setResizing] = useState(false);
  const [canDrag, setCanDrag] = useState(true);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: {
        id, left, top, width, height, title, component, zoomLevel
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }),
    [id, left, top, height, width, title, component, index, zoomLevel]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, []);

  useEffect(() => {
    if (resizingStatusChanged) {
      resizingStatusChanged(isResizing);
    }
  }, [isResizing]);

  const style = {
    display: 'inline-block',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px'
  };

  let refProps = {};

  if (mode === 'edit' && canDrag) {
    refProps = {
      ref: drag
    };
  }

  function changeCanDrag(newState) {
    setCanDrag(newState);
  }

  return (
    <div>
      {inCanvas ? (
        <div style={getStyles(left, top, isDragging)}>
          <Resizable
            style={{ ...style }}
            defaultSize={{}}
            className="resizer"
            onResize={() => setResizing(true)}
            handleClasses={resizerClasses}
            handleStyles={resizerStyles}
            onResizeStop={(e, direction, ref, d) => {
              setResizing(false);
              onResizeStop(id, width, height, e, direction, ref, d);
            }}
          >
            <div {...refProps} role="DraggableBox" style={isResizing ? { opacity: 0.5 } : { opacity: 1 }}>
              <Box
                component={component}
                id={id}
                width={width}
                mode={mode}
                height={height}
                changeCanDrag={changeCanDrag}
                inCanvas={inCanvas}
                paramUpdated={paramUpdated}
                onEvent={onEvent}
                onComponentOptionChanged={onComponentOptionChanged}
                onComponentOptionsChanged={onComponentOptionsChanged}
                onComponentClick={onComponentClick}
                currentState={currentState}
              />
            </div>
          </Resizable>
        </div>
      ) : (
        <div ref={drag} role="DraggableBox">
          <Box
            component={component}
            id={id}
            mode={mode}
            inCanvas={inCanvas}
            onEvent={onEvent}
            paramUpdated={paramUpdated}
            onComponentOptionChanged={onComponentOptionChanged}
            onComponentOptionsChanged={onComponentOptionsChanged}
            onComponentClick={onComponentClick}
            currentState={currentState}
          />
        </div>
      )}
    </div>
  );
};
