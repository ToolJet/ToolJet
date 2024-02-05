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
import { useNoOfGrid, useGridStore } from '@/_stores/gridStore';
import WidgetBox from './WidgetBox';
import * as Sentry from '@sentry/react';

// const noOfGrid = 43;

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
    parent,
    allComponents,
    component,
    index,
    inCanvas,
    onEvent,
    onComponentClick,
    onComponentOptionChanged,
    onComponentOptionsChanged,
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
    const [noOfGrid] = useNoOfGrid();
    const {
      currentLayout,
      setHoveredComponent,
      mouseOver,
      selectionInProgress,
      isSelectedComponent,
      isMultipleComponentsSelected,
      autoComputeLayout,
    } = useEditorStore(
      (state) => ({
        currentLayout: state?.currentLayout,
        setHoveredComponent: state?.actions?.setHoveredComponent,
        mouseOver: state?.hoveredComponent === id,
        selectionInProgress: state?.selectionInProgress,
        isSelectedComponent:
          mode === 'edit' ? state?.selectedComponents?.some((component) => component?.id === id) : false,
        isMultipleComponentsSelected: state?.selectedComponents?.length > 1 ? true : false,
        autoComputeLayout: state?.appDefinition?.pages?.[state?.currentPageId]?.autoComputeLayout,
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
          autoComputeLayout,
        },
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }),
      [id, title, component, index, currentLayout, zoomLevel, parent, layouts, canvasWidth, autoComputeLayout]
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
    const gridWidth = canvasWidth / noOfGrid;
    const width = (canvasWidth * layoutData.width) / noOfGrid;

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
            ? 'widget-in-canvas'
            : cx('text-center align-items-center clearfix draggable-box-wrapper', {
                '': component.component !== 'KanbanBoard',
                'd-none': component.component === 'KanbanBoard',
              })
        }
        style={!inCanvas ? {} : { width: computeWidth() }}
      >
        {inCanvas ? (
          <div
            className={cx(`draggable-box w-100 widget-${id}`, {
              [className]: !!className,
              'draggable-box-in-editor': mode === 'edit',
            })}
            onMouseEnter={(e) => {
              if (useGridStore.getState().draggingComponentId) return;
              const closestDraggableBox = e.target.closest('.draggable-box');
              if (closestDraggableBox) {
                const classNames = closestDraggableBox.className.split(' ');
                let compId = null;

                classNames.forEach((className) => {
                  if (className.startsWith('widget-')) {
                    compId = className.replace('widget-', '');
                  }
                });

                onComponentHover?.(compId);
                e.stopPropagation();
              }
            }}
            onMouseLeave={(e) => {
              if (useGridStore.getState().draggingComponentId) return;
              setHoveredComponent('');
            }}
            style={getStyles(isDragging, isSelectedComponent)}
          >
            <div ref={preview} role="DraggableBox" style={isResizing ? { opacity: 0.5 } : { opacity: 1 }}>
              {mode === 'edit' && !readOnly && (
                <ConfigHandle
                  id={id}
                  removeComponent={removeComponent}
                  component={component}
                  position={layoutData.top < 15 ? 'bottom' : 'top'}
                  widgetTop={layoutData.top}
                  widgetHeight={layoutData.height}
                  isMultipleComponentsSelected={isMultipleComponentsSelected}
                  configWidgetHandlerForModalComponent={configWidgetHandlerForModalComponent}
                  mouseOver={mouseOver}
                  isSelectedComponent={isSelectedComponent}
                  showHandle={(configWidgetHandlerForModalComponent || mouseOver || isSelectedComponent) && !isResizing}
                />
              )}
              <Sentry.ErrorBoundary
                fallback={<h2>Something went wrong.</h2>}
                beforeCapture={(scope) => {
                  scope.setTag('errorType', 'component');
                }}
              >
                <Box
                  component={component}
                  id={id}
                  width={width}
                  height={layoutData.height}
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
              </Sentry.ErrorBoundary>
            </div>
            {/* </Rnd> */}
          </div>
        ) : (
          <div ref={drag} role="DraggableBox" className="draggable-box" style={{ height: '100%' }}>
            <ErrorBoundary showFallback={mode === 'edit'}>
              <WidgetBox component={component} darkMode={darkMode} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    );
  }
);
