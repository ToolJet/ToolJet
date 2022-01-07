/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';
import { ConfigHandle } from './ConfigHandle';
import { Rnd } from 'react-rnd';

const resizerClasses = {
  topRight: 'top-right',
  bottomRight: 'bottom-right',
  bottomLeft: 'bottom-left',
  topLeft: 'top-left',
};

const resizerStyles = {
  topRight: {
    width: '12px',
    height: '12px',
    right: '-6px',
    top: '-6px',
  },
  bottomRight: {
    width: '12px',
    height: '12px',
    right: '-6px',
    bottom: '-6px',
  },
  bottomLeft: {
    width: '12px',
    height: '12px',
    left: '-6px',
    bottom: '-6px',
  },
  topLeft: {
    width: '12px',
    height: '12px',
    left: '-6px',
    top: '-6px',
  },
};

function computeWidth(currentLayoutOptions) {
  return `${currentLayoutOptions?.width}%`;
}

function getStyles(isDragging, isSelectedComponent) {
  return {
    position: 'absolute',
    zIndex: isSelectedComponent ? 2 : 1,
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
    opacity: isDragging ? 0 : 1,
  };
}

export const DraggableBox = function DraggableBox({
  id,
  mode,
  title,
  _left,
  _top,
  parent,
  component,
  index,
  inCanvas,
  onEvent,
  onComponentClick,
  currentState,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  onResizeStop,
  onDragStop,
  paramUpdated,
  resizingStatusChanged,
  zoomLevel,
  containerProps,
  configHandleClicked,
  removeComponent,
  currentLayout,
  layouts,
  _deviceWindowWidth,
  isSelectedComponent,
  draggingStatusChanged,
  darkMode,
  canvasWidth,
}) {
  const [isResizing, setResizing] = useState(false);
  const [isDragging2, setDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(true);
  const [mouseOver, setMouseOver] = useState(false);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: {
        id,
        title,
        component,
        zoomLevel,
        parent,
        layouts,
        canvasWidth,
        currentLayout,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, title, component, index, zoomLevel, parent, layouts, currentLayout, canvasWidth]
  );

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [isDragging]);

  useEffect(() => {
    if (resizingStatusChanged) {
      resizingStatusChanged(isResizing);
    }
  }, [isResizing]);

  useEffect(() => {
    if (draggingStatusChanged) {
      draggingStatusChanged(isDragging2);
    }
  }, [isDragging2]);

  const style = {
    display: 'inline-block',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0px',
  };

  let _refProps = {};

  if (mode === 'edit' && canDrag) {
    _refProps = {
      ref: drag,
    };
  }

  function changeCanDrag(newState) {
    setCanDrag(newState);
  }

  const defaultData = {
    top: 100,
    left: 0,
    width: 445,
    height: 500,
  };

  const layoutData = inCanvas ? layouts[currentLayout] || defaultData : defaultData;
  const [currentLayoutOptions, setCurrentLayoutOptions] = useState(layoutData);

  useEffect(() => {
    console.log(layoutData);
    setCurrentLayoutOptions(layoutData);
  }, [layoutData.height, layoutData.width, layoutData.left, layoutData.top, currentLayout]);

  const gridWidth = canvasWidth / 43;
  const width = (canvasWidth * currentLayoutOptions.width) / 43;

  return (
    <div
      className={inCanvas ? '' : 'col-md-4 text-center align-items-center clearfix mb-2'}
      style={!inCanvas ? {} : { width: computeWidth() }}
    >
      {inCanvas ? (
        <div
          className="draggable-box "
          onMouseOver={() => setMouseOver(true)}
          onMouseLeave={() => setMouseOver(false)}
          style={getStyles(isDragging, isSelectedComponent)}
        >
          <Rnd
            style={{ ...style }}
            resizeGrid={[gridWidth, 10]}
            dragGrid={[gridWidth, 10]}
            size={{
              width: width,
              height: currentLayoutOptions.height,
            }}
            position={{
              x: currentLayoutOptions ? (currentLayoutOptions.left * canvasWidth) / 100 : 0,
              y: currentLayoutOptions ? currentLayoutOptions.top : 0,
            }}
            defaultSize={{}}
            className={`resizer ${mouseOver || isResizing || isSelectedComponent ? 'resizer-active' : ''} `}
            onResize={() => setResizing(true)}
            onDrag={(e) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              setDragging(true);
            }}
            resizeHandleClasses={isSelectedComponent || mouseOver ? resizerClasses : {}}
            resizeHandleStyles={resizerStyles}
            disableDragging={mode !== 'edit'}
            onDragStop={(e, direction) => {
              setDragging(false);
              onDragStop(e, id, direction, currentLayout, currentLayoutOptions);
            }}
            cancel={`div.table-responsive.jet-data-table, div.calendar-widget, div.text-input, .textarea`}
            onDragStart={(e) => e.stopPropagation()}
            enableResizing={mode === 'edit'}
            onResizeStop={(e, direction, ref, d, position) => {
              setResizing(false);
              onResizeStop(id, e, direction, ref, d, position);
            }}
            bounds={parent !== undefined ? `#canvas-${parent}` : '.real-canvas'}
          >
            <div ref={preview} role="DraggableBox" style={isResizing ? { opacity: 0.5 } : { opacity: 1 }}>
              {mode === 'edit' && mouseOver && !isResizing && (
                <ConfigHandle
                  id={id}
                  removeComponent={removeComponent}
                  component={component}
                  configHandleClicked={(id, component) => configHandleClicked(id, component)}
                />
              )}
              <Box
                component={component}
                id={id}
                width={width}
                height={currentLayoutOptions.height - 4}
                mode={mode}
                changeCanDrag={changeCanDrag}
                inCanvas={inCanvas}
                paramUpdated={paramUpdated}
                onEvent={onEvent}
                onComponentOptionChanged={onComponentOptionChanged}
                onComponentOptionsChanged={onComponentOptionsChanged}
                onComponentClick={onComponentClick}
                currentState={currentState}
                containerProps={containerProps}
                darkMode={darkMode}
                removeComponent={removeComponent}
                canvasWidth={canvasWidth}
              />
            </div>
          </Rnd>
        </div>
      ) : (
        <div ref={drag} role="DraggableBox" className="draggable-box" style={{ height: '100%' }}>
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
            darkMode={darkMode}
            removeComponent={removeComponent}
          />
        </div>
      )}
    </div>
  );
};
