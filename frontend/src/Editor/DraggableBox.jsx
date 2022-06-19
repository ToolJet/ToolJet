/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';
import { ConfigHandle } from './ConfigHandle';
import { Rnd } from 'react-rnd';
import ErrorBoundary from './ErrorBoundary';

const resizerClasses = {
  topRight: 'top-right',
  bottomRight: 'bottom-right',
  bottomLeft: 'bottom-left',
  topLeft: 'top-left',
};

const resizerStyles = {
  topRight: {
    width: '8px',
    height: '8px',
    right: '-4px',
    top: '-4px',
  },
  bottomRight: {
    width: '8px',
    height: '8px',
    right: '-4px',
    bottom: '-4px',
  },
  bottomLeft: {
    width: '8px',
    height: '8px',
    left: '-4px',
    bottom: '-4px',
  },
  topLeft: {
    width: '8px',
    height: '8px',
    left: '-4px',
    top: '-4px',
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
  className,
  mode,
  title,
  _left,
  _top,
  parent,
  allComponents,
  extraProps,
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
  setSelectedComponent,
  removeComponent,
  currentLayout,
  layouts,
  _deviceWindowWidth,
  isSelectedComponent,
  draggingStatusChanged,
  darkMode,
  canvasWidth,
  readOnly,
  customResolvables,
  parentId,
  hoveredComponent,
  onComponentHover,
  isMultipleComponentsSelected,
  dataQueries,
}) {
  const [isResizing, setResizing] = useState(false);
  const [isDragging2, setDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(true);
  const [mouseOver, setMouseOver] = useState(false);

  useEffect(() => {
    setMouseOver(hoveredComponent === id);
  }, [hoveredComponent]);

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

    if (isDragging2 && !isSelectedComponent) {
      setSelectedComponent(id, component);
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
          className={cx(`draggable-box widget-${id}`, {
            [className]: !!className,
            'draggable-box-in-editor': mode === 'edit',
          })}
          onMouseEnter={(e) => {
            if (e.currentTarget.className.includes(`widget-${id}`)) {
              onComponentHover?.(id);
              e.stopPropagation();
            }
          }}
          onMouseLeave={() => onComponentHover?.(false)}
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
            className={`resizer ${
              mouseOver || isResizing || isDragging2 || isSelectedComponent ? 'resizer-active' : ''
            } `}
            onResize={() => setResizing(true)}
            onDrag={(e, direction) => {
              e.preventDefault();
              e.stopImmediatePropagation();
              if (!isDragging2) {
                setDragging(true);
              }
            }}
            resizeHandleClasses={isSelectedComponent || mouseOver ? resizerClasses : {}}
            resizeHandleStyles={resizerStyles}
            enableResizing={mode === 'edit' && !readOnly}
            disableDragging={mode !== 'edit' || readOnly}
            onDragStop={(e, direction) => {
              setDragging(false);
              onDragStop(e, id, direction, currentLayout, currentLayoutOptions);
            }}
            cancel={`div.table-responsive.jet-data-table, div.calendar-widget, div.text-input, .textarea, .map-widget, .range-slider, .kanban-container`}
            onDragStart={(e) => e.stopPropagation()}
            onResizeStop={(e, direction, ref, d, position) => {
              setResizing(false);
              onResizeStop(id, e, direction, ref, d, position);
            }}
            bounds={parent !== undefined ? `#canvas-${parent}` : '.real-canvas'}
          >
            <div ref={preview} role="DraggableBox" style={isResizing ? { opacity: 0.5 } : { opacity: 1 }}>
              {mode === 'edit' && !readOnly && (mouseOver || isSelectedComponent) && !isResizing && (
                <ConfigHandle
                  id={id}
                  removeComponent={removeComponent}
                  component={component}
                  position={currentLayoutOptions.top < 15 ? 'bottom' : 'top'}
                  widgetTop={currentLayoutOptions.top}
                  widgetHeight={currentLayoutOptions.height}
                  setSelectedComponent={(id, component, multiSelect) =>
                    setSelectedComponent(id, component, multiSelect)
                  }
                  isMultipleComponentsSelected={isMultipleComponentsSelected}
                />
              )}
              <ErrorBoundary showFallback={mode === 'edit'}>
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
                  readOnly={readOnly}
                  customResolvables={customResolvables}
                  parentId={parentId}
                  allComponents={allComponents}
                  extraProps={extraProps}
                  dataQueries={dataQueries}
                />
              </ErrorBoundary>
            </div>
          </Rnd>
        </div>
      ) : (
        <div ref={drag} role="DraggableBox" className="draggable-box" style={{ height: '100%' }}>
          <ErrorBoundary showFallback={mode === 'edit'}>
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
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};
