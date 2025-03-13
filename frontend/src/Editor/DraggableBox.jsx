/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './editorConstants';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';
import { ConfigHandle } from './ConfigHandle';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import ErrorBoundary from './ErrorBoundary';
import { useEditorStore } from '@/_stores/editorStore';
import { shallow } from 'zustand/shallow';
import { useGridStore } from '@/_stores/gridStore';
import WidgetBox from './WidgetBox';
import * as Sentry from '@sentry/react';
import { findHighestLevelofSelection } from './DragContainer';
import { useCurrentStateStore } from '@/_stores/currentStateStore';
import { useResolveStore } from '@/_stores/resolverStore';

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

const DraggableBox = React.memo(
  ({
    id,
    className,
    mode,
    title,
    parent,
    component,
    index,
    inCanvas,
    onEvent,
    onComponentClick,
    paramUpdated,
    zoomLevel,
    removeComponent,
    layouts,
    darkMode,
    canvasWidth,
    readOnly,
    customResolvables,
    parentId,
    getContainerProps,
    currentPageId,
    onComponentOptionChanged = null,
    onComponentOptionsChanged = null,
    isFromSubContainer = false,
    childComponents = null,
  }) => {
    const isResizing = useGridStore((state) => state.resizingComponentId === id);
    const [canDrag, setCanDrag] = useState(true);
    const noOfGrid = 43;
    const {
      currentLayout,
      setHoveredComponent,
      selectionInProgress,
      isSelectedComponent,
      isMultipleComponentsSelected,
      autoComputeLayout,
    } = useEditorStore(
      (state) => ({
        currentLayout: state?.currentLayout,
        setHoveredComponent: state?.actions?.setHoveredComponent,
        selectionInProgress: state?.selectionInProgress,
        isSelectedComponent:
          mode === 'edit' ? state?.selectedComponents?.some((component) => component?.id === id) : false,
        isMultipleComponentsSelected: findHighestLevelofSelection(state?.selectedComponents)?.length > 1 ? true : false,
        autoComputeLayout: state?.appDefinition?.pages?.[state?.currentPageId]?.autoComputeLayout,
      }),
      shallow
    );

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
      width: 43,
      height: 500,
    };

    const layoutData = inCanvas ? layouts[currentLayout] || layouts['desktop'] : defaultData;
    const width = (canvasWidth * layoutData.width) / noOfGrid;

    const configWidgetHandlerForModalComponent =
      !isSelectedComponent &&
      component.component === 'Modal' &&
      resolveWidgetFieldValue(component.definition.properties.useDefaultButton?.value) === false;

    const onComponentHover = useCallback(
      (id) => {
        if (selectionInProgress) return;
        setHoveredComponent(id);
      },
      [id]
    );

    const isEditorReady = useCurrentStateStore.getState().isEditorReady;
    const isResolverStoreReady = useResolveStore.getState().storeReady;

    const isCanvasReady = isEditorReady && isResolverStoreReady;
    /**
     * !This component does not consume the value returned from the below hook.
     * Only purpose of the hook is to force one rerender the component
     * */
    useEditorStore((state) => state.componentsNeedsUpdateOnNextRender.find((compId) => compId === id));

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
            onMouseLeave={() => {
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
                  isSelectedComponent={isSelectedComponent}
                  showHandle={configWidgetHandlerForModalComponent || isSelectedComponent}
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
                  height={layoutData.height - 4}
                  mode={mode}
                  changeCanDrag={changeCanDrag}
                  inCanvas={inCanvas}
                  paramUpdated={paramUpdated}
                  onEvent={onEvent}
                  onComponentClick={onComponentClick}
                  darkMode={darkMode}
                  removeComponent={removeComponent}
                  canvasWidth={canvasWidth}
                  readOnly={readOnly}
                  customResolvables={customResolvables}
                  parentId={parentId}
                  getContainerProps={getContainerProps}
                  currentPageId={currentPageId}
                  onOptionChanged={onComponentOptionChanged}
                  onOptionsChanged={onComponentOptionsChanged}
                  isFromSubContainer={isFromSubContainer}
                  childComponents={childComponents}
                  isCanvasReady={isCanvasReady}
                />
              </Sentry.ErrorBoundary>
            </div>
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

export { DraggableBox };
