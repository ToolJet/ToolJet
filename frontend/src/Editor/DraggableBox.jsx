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
  // scaleWidth(currentLayoutOptions.width, scaleValue) - 4
  return `${currentLayoutOptions?.width}%`;
}

function getStyles(left, top, isDragging, component, isSelectedComponent, currentLayoutOptions) {
  // const transform = `translate3d(${left}px, ${top}px, 0)`;
  return {
    position: 'absolute',
    // transform,
    // WebkitTransform: transform,
    zIndex: isSelectedComponent ? 2 : 1,
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
    opacity: isDragging ? 0 : 1,
    height: isDragging ? 0 : '100%',
    width: computeWidth(currentLayoutOptions),
  };
}

export const DraggableBox = function DraggableBox({
  id,
  mode,
  title,
  left,
  top,
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
  paramUpdated,
  resizingStatusChanged,
  zoomLevel,
  containerProps,
  configHandleClicked,
  removeComponent,
  currentLayout,
  layouts,
  scaleValue,
  deviceWindowWidth,
  isSelectedComponent,
  darkMode,
  canvasWidth,
}) {
  const [isResizing, setResizing] = useState(false);
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

  const style = {
    display: 'inline-block',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0px',
  };

  let refProps = {};

  if (mode === 'edit' && canDrag) {
    refProps = {
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

  function scaleWidth(width, scaleValue) {
    let newWidth = width * scaleValue;

    if (currentLayout === 'desktop') return newWidth;

    const diff = currentLayoutOptions.left + newWidth - deviceWindowWidth;

    if (diff > 0) {
      setCurrentLayoutOptions({
        ...currentLayoutOptions,
        left: currentLayoutOptions.left - diff,
      });

      return width;
    }

    return newWidth;
  }

  return (
    <div
      className={inCanvas ? '' : 'col-md-4 text-center align-items-center clearfix mb-2'}
      style={!inCanvas ? {} : { width: computeWidth() }}
    >
      {inCanvas ? (
        <div
          style={getStyles(left, top, isDragging, component, isSelectedComponent, currentLayoutOptions)}
          className="draggable-box "
          onMouseOver={() => setMouseOver(true)}
          onMouseLeave={() => setMouseOver(false)}
        >
          <Rnd
            style={{ ...style }}
            resizeGrid={[canvasWidth / 43, 10]}
            size={{
              width: (canvasWidth * currentLayoutOptions.width) / 43,
              height: currentLayoutOptions.height,
            }}
            position={{
              x: currentLayoutOptions ? (currentLayoutOptions.left * canvasWidth) / 100 : 0,
              y: currentLayoutOptions ? currentLayoutOptions.top : 0,
            }}
            defaultSize={{}}
            className={`resizer ${mouseOver || isResizing || isSelectedComponent ? 'resizer-active' : ''} `}
            onResize={() => setResizing(true)}
            resizeHandleClasses={isSelectedComponent || mouseOver ? resizerClasses : {}}
            resizeHandleStyles={resizerStyles}
            disableDragging={true}
            enableResizing={mode === 'edit'}
            onResizeStop={(e, direction, ref, d, position) => {
              setResizing(false);
              onResizeStop(id, e, direction, ref, d, position);
            }}
          >
            <div ref={preview} role="DraggableBox" style={isResizing ? { opacity: 0.5 } : { opacity: 1 }}>
              {mode === 'edit' && mouseOver && !isResizing && (
                <ConfigHandle
                  id={id}
                  removeComponent={removeComponent}
                  dragRef={refProps.ref}
                  component={component}
                  configHandleClicked={(id, component) => configHandleClicked(id, component)}
                />
              )}
              <Box
                component={component}
                id={id}
                width={scaleWidth(currentLayoutOptions.width, scaleValue) - 4}
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
