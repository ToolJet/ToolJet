/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';
import { ConfigHandle } from './ConfigHandle';
import { Rnd } from 'react-rnd';
import { resolveWidgetFieldValue, resolveReferences } from '@/_helpers/utils';
import ErrorBoundary from './ErrorBoundary';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import WidgetBox from './WidgetBox';
import * as Sentry from '@sentry/react';
const NO_OF_GRIDS = 43;

const resizerClasses = {
  topRight: 'top-right',
  bottomRight: 'bottom-right',
  bottomLeft: 'bottom-left',
  topLeft: 'top-left',
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
    const [boxHeight, setboxHeight] = useState(layoutData?.height); // height for layouting with top and side values

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
    const gridWidth = canvasWidth / NO_OF_GRIDS;
    const width = (canvasWidth * layoutData.width) / NO_OF_GRIDS;
    const configWidgetHandlerForModalComponent =
      !isSelectedComponent &&
      component.component === 'Modal' &&
      resolveWidgetFieldValue(component.definition.properties.useDefaultButton, currentState)?.value === false;

    const onComponentHover = (id) => {
      if (selectionInProgress) return;
      setHoveredComponent(id);
    };

    const { label = { value: null } } = component?.definition?.properties ?? {};

    useEffect(() => {
      if (
        component.component == 'TextInput' ||
        component.component == 'PasswordInput' ||
        component.component == 'NumberInput'
      ) {
        const { alignment = { value: null } } = component?.definition?.styles ?? {};
        let newHeight = layoutData?.height;
        if (alignment?.value && resolveReferences(alignment?.value, currentState, null, customResolvables) === 'top') {
          const { width = { value: null } } = component?.definition?.styles ?? {};
          const { auto = { value: null } } = component?.definition?.styles ?? {};
          const resolvedWidth = resolveReferences(width?.value, currentState, null, customResolvables);
          const resolvedAuto = resolveReferences(auto?.value, currentState, null, customResolvables);
          if (
            (label?.value?.length > 0 && resolvedWidth > 0) ||
            (resolvedAuto && resolvedWidth == 0 && label?.value && label?.value?.length != 0)
          ) {
            newHeight = layoutData?.height + 20;
          }
        }
        setboxHeight(newHeight);
      }
    }, [layoutData?.height, label?.value?.length, currentLayout]);

    const adjustHeightBasedOnAlignment = (increase) => {
      if (increase) return setboxHeight(layoutData?.height + 20);
      else return setboxHeight(layoutData?.height);
    };
    return (
      <div
        className={
          inCanvas
            ? ''
            : cx('text-center align-items-center clearfix draggable-box-wrapper', {
                '': component.component !== 'KanbanBoard',
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
              maxWidth={canvasWidth}
              style={{ ...style }}
              resizeGrid={[gridWidth, 10]}
              dragGrid={[gridWidth, 10]}
              size={{
                width: width,
                height: boxHeight,
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
              enableResizing={{
                top: mode == 'edit' && !readOnly,
                right: mode == 'edit' && !readOnly && true,
                bottom: mode == 'edit' && !readOnly,
                left: mode == 'edit' && !readOnly && true,
                topRight: mode == 'edit' && !readOnly,
                bottomRight: mode == 'edit' && !readOnly,
                bottomLeft: mode == 'edit' && !readOnly,
                topLeft: mode == 'edit' && !readOnly,
              }}
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
                {/* Adding a sentry's error boundary to differentiate between our generic error boundary and one from editor's component  */}
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
                    height={layoutData.height - 4}
                    mode={mode}
                    changeCanDrag={changeCanDrag}
                    inCanvas={inCanvas}
                    paramUpdated={paramUpdated}
                    onEvent={onEvent}
                    onComponentOptionChanged={onComponentOptionChanged}
                    onComponentOptionsChanged={onComponentOptionsChanged}
                    onComponentClick={onComponentClick}
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
                    isResizing={isResizing}
                    adjustHeightBasedOnAlignment={adjustHeightBasedOnAlignment}
                    currentLayout={currentLayout}
                  />
                </Sentry.ErrorBoundary>
              </div>
            </Rnd>
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
