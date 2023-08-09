/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';
import { ConfigHandle } from './ConfigHandle';
import { Rnd } from 'react-rnd';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import ErrorBoundary from './ErrorBoundary';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';

const NO_OF_GRIDS = 43;

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

export const DraggableBox = React.memo(
  ({
    id,
    className,
    mode,
    title,
    _left,
    _top,
    parent,
    allComponents,
    component,
    index,
    inCanvas,
    onEvent,
    onComponentClick,
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
    layouts,
    draggingStatusChanged,
    darkMode,
    canvasWidth,
    readOnly,
    customResolvables,
    parentId,
    sideBarDebugger,
    childComponents = null,
  }) => {
    const [isResizing, setResizing] = useState(false);
    const [isDragging2, setDragging] = useState(false);
    const [canDrag, setCanDrag] = useState(true);
    const {
      currentLayout,
      setHoveredComponent,
      mouseOver,
      selectionInProgress,
      isSelectedComponent,
      isMultipleComponentsSelected,
    } = useEditorStore(
      (state) => ({
        currentLayout: state?.currentLayout,
        setHoveredComponent: state?.actions?.setHoveredComponent,
        mouseOver: state?.hoveredComponent === id,
        selectionInProgress: state?.selectionInProgress,
        isSelectedComponent:
          mode === 'edit' ? state?.selectedComponents?.some((component) => component?.id === id) : false,
        isMultipleComponentsSelected: state?.selectedComponents?.length > 1 ? true : false,
      }),
      shallow
    );
    const currentState = useCurrentState();

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
      [id, title, component, index, currentLayout, zoomLevel, parent, layouts, canvasWidth]
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

    const changeCanDrag = useCallback(
      (newState) => {
        setCanDrag(newState);
      },
      [setCanDrag]
    );

    const defaultData = {
      top: 100,
      left: 0,
      width: 445,
      height: 500,
    };

    const layoutData = inCanvas ? layouts[currentLayout] || defaultData : defaultData;
    const gridWidth = canvasWidth / 43;
    const width = (canvasWidth * layoutData.width) / 43;

    const configWidgetHandlerForModalComponent =
      !isSelectedComponent &&
      component.component === 'Modal' &&
      resolveWidgetFieldValue(component.definition.properties.useDefaultButton, currentState)?.value === false;

    const onComponentHover = (id) => {
      if (selectionInProgress) return;
      setHoveredComponent(id);
    };

    return (
      <div
        className={
          inCanvas
            ? ''
            : cx('text-center align-items-center clearfix mb-2', {
                'col-md-4': component.component !== 'KanbanBoard',
                'd-none': component.component === 'KanbanBoard',
              })
        }
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
            onMouseLeave={() => {
              setHoveredComponent('');
            }}
            style={getStyles(isDragging, isSelectedComponent)}
          >
            <Rnd
              style={{ ...style }}
              resizeGrid={[gridWidth, 10]}
              dragGrid={[gridWidth, 10]}
              size={{
                width: width,
                height: layoutData.height,
              }}
              position={{
                x: layoutData ? (layoutData.left * canvasWidth) / 100 : 0,
                y: layoutData ? layoutData.top : 0,
              }}
              defaultSize={{}}
              className={`resizer ${
                mouseOver || isResizing || isDragging2 || isSelectedComponent ? 'resizer-active' : ''
              } `}
              onResize={() => setResizing(true)}
              onDrag={(e) => {
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
                onDragStop(e, id, direction, currentLayout, layoutData);
              }}
              cancel={`div.table-responsive.jet-data-table, div.calendar-widget, div.text-input, .textarea, .map-widget, .range-slider, .kanban-container, div.real-canvas`}
              onResizeStop={(e, direction, ref, d, position) => {
                setResizing(false);
                onResizeStop(id, e, direction, ref, d, position);
              }}
              bounds={parent !== undefined ? `#canvas-${parent}` : '.real-canvas'}
              widgetId={id}
            >
              <div ref={preview} role="DraggableBox" style={isResizing ? { opacity: 0.5 } : { opacity: 1 }}>
                {mode === 'edit' &&
                  !readOnly &&
                  (configWidgetHandlerForModalComponent || mouseOver || isSelectedComponent) &&
                  !isResizing && (
                    <ConfigHandle
                      id={id}
                      removeComponent={removeComponent}
                      component={component}
                      position={layoutData.top < 15 ? 'bottom' : 'top'}
                      widgetTop={layoutData.top}
                      widgetHeight={layoutData.height}
                      isMultipleComponentsSelected={isMultipleComponentsSelected}
                      configWidgetHandlerForModalComponent={configWidgetHandlerForModalComponent}
                    />
                  )}
                <ErrorBoundary showFallback={mode === 'edit'}>
                  <Box
                    component={component}
                    id={id}
                    width={width}
                    height={layoutData.height - 4}
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
                    sideBarDebugger={sideBarDebugger}
                    childComponents={childComponents}
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
                sideBarDebugger={sideBarDebugger}
                customResolvables={customResolvables}
                containerProps={containerProps}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    );
  }
);
