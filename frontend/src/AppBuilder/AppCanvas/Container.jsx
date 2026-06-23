/* eslint-disable import/no-named-as-default */
import React, { useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import cx from 'classnames';
import WidgetWrapper from './WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDrop, useDragLayer } from 'react-dnd';
import {
  computeViewerBackgroundColor,
  getSubContainerWidthAfterPadding,
  getSubContainerHeightAfterPadding,
} from './appCanvasUtils';
import {
  NO_OF_GRIDS,
  GRID_HEIGHT,
  HOVER_CLICK_OUTLINE_BORDER,
  PAGE_CANVAS_HEADER_FOOTER_PADDING,
  ROW_SCOPED_WIDGET_TYPES,
} from './appCanvasConstants';
import { useGridStore } from '@/_stores/gridStore';
import NoComponentCanvasContainer from './NoComponentCanvasContainer';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useSortedComponents from '../_hooks/useSortedComponents';
import { useDropVirtualMoveableGhost } from './Grid/hooks/useDropVirtualMoveableGhost';
import { findNewParentIdFromMousePosition } from './Grid/gridUtils';
import { computeFlexInsertIndex } from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';
import { FlexContainerDropIndicator } from '@/AppBuilder/Widgets/FlexContainer/FlexContainerDropIndicator';

// Lazy load editor-only component to reduce viewer bundle size
const ModuleContainerBlank = lazy(() =>
  import('@/modules/Modules/components').then((m) => ({ default: m.ModuleContainerBlank }))
);

//TODO: Revisit the logic of height (dropRef)

/*
  index - used to identify the subcontainer index
  onOptionChange - used to pass the onOptionChange function to the child components and pass the exposedValues to the parent component
*/
const Container = React.memo(
  ({
    id,
    canvasWidth,
    canvasHeight,
    index = null,
    onOptionChange = null,
    onOptionsChange = null,
    allowContainerSelect = false,
    styles,
    listViewMode = 'list',
    columns,
    darkMode,
    canvasMaxWidth: _canvasMaxWidth,
    componentType,
    appType,
    hasNoScroll = false,
    flexEffectiveDirection,
    flexShouldStack = false,
  }) => {
    const { moduleId, isModuleEditor } = useModuleContext();
    const realCanvasRef = useRef(null);
    const components = useStore((state) => state.getContainerChildrenMapping(id, moduleId), shallow);
    const setLastCanvasClickPosition = useStore((state) => state.setLastCanvasClickPosition, shallow);
    const isEmbeddedModule = appType === 'module' && !isModuleEditor;
    const canvasBgColor = useStore(
      (state) => (id === 'canvas' ? state.getCanvasBackgroundColor('canvas', darkMode) : ''),
      shallow
    );
    const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
    const currentLayout = useStore((state) => state.currentLayout, shallow);
    const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);
    const isWidgetInSubContainerDragging = useStore(
      (state) => state.containerChildrenMapping?.[id]?.includes(state?.draggingComponentId),
      shallow
    );
    const isFlexContainer = componentType === 'FlexContainer';
    const setCurrentDragCanvasId = useGridStore((state) => state.actions.setCurrentDragCanvasId);
    const setFlexContainerDropTarget = useStore((state) => state.setFlexContainerDropTarget, shallow);
    const flexDirection = useStore(
      (state) => (isFlexContainer ? state.getResolvedComponent?.(id)?.properties?.direction ?? 'column' : 'column'),
      shallow
    );
    const flexDirectionForFlex = isFlexContainer ? flexEffectiveDirection ?? flexDirection : flexDirection;

    // Initialize ghost moveable hook
    const { activateMoveableGhost, deactivateMoveableGhost } = useDropVirtualMoveableGhost();

    // rAF ref to throttle FlexContainer drop-target updates
    const flexRafRef = useRef(null);

    // // Monitor drag layer to update ghost position continuously
    const { isDragging, clientOffset, draggedItem } = useDragLayer((monitor) => ({
      isDragging: monitor.isDragging(),
      clientOffset: monitor.getClientOffset(),
      draggedItem: monitor.getItem(),
    }));
    // // // Cleanup ghost when drag ends
    useEffect(() => {
      if (!isDragging) {
        if (flexRafRef.current) {
          cancelAnimationFrame(flexRafRef.current);
          flexRafRef.current = null;
        }
        deactivateMoveableGhost();
        if (isFlexContainer) {
          setFlexContainerDropTarget(null);
        }
      }
    }, [id, isDragging, deactivateMoveableGhost, isFlexContainer, setFlexContainerDropTarget]);

    useEffect(() => {
      if (id !== 'canvas' || !isDragging || !clientOffset || !draggedItem?.component?.defaultSize) return;

      const canvasArea = document.getElementsByClassName('tj-canvas-area')?.[0];
      if (!canvasArea) return;

      const canvasAreaRect = canvasArea.getBoundingClientRect();
      const isPointerInsideCanvasArea =
        clientOffset.x >= canvasAreaRect.left &&
        clientOffset.x <= canvasAreaRect.right &&
        clientOffset.y >= canvasAreaRect.top &&
        clientOffset.y <= canvasAreaRect.bottom;

      if (!isPointerInsideCanvasArea) return;

      const hoveredCanvasId = findNewParentIdFromMousePosition(clientOffset.x, clientOffset.y, id);
      if (hoveredCanvasId) {
        setCurrentDragCanvasId(hoveredCanvasId);
      } else {
        setCurrentDragCanvasId('canvas');
      }

      const appCanvasWidth = realCanvasRef?.current?.offsetWidth || 0;
      const componentSize = {
        width: (appCanvasWidth * draggedItem.component.defaultSize.width) / NO_OF_GRIDS,
        height: draggedItem.component.defaultSize.height,
      };

      activateMoveableGhost(componentSize, clientOffset, realCanvasRef);
    }, [id, isDragging, clientOffset, draggedItem, activateMoveableGhost, setCurrentDragCanvasId]);

    const isContainerReadOnly = useMemo(() => {
      return (index !== 0 && ROW_SCOPED_WIDGET_TYPES.includes(componentType)) || currentMode === 'view';
    }, [index, componentType, currentMode]);

    const [{ isOverCurrent }, drop] = useDrop({
      accept: 'box',
      canDrop: () => !isContainerReadOnly,
      hover: (item, monitor) => {
        if (isContainerReadOnly) return;
        const clientOffset = monitor.getClientOffset();

        const appCanvasWidth = realCanvasRef?.current?.offsetWidth || 0;

        if (clientOffset) {
          const canvasId = findNewParentIdFromMousePosition(clientOffset.x, clientOffset.y, id);
          if (canvasId === id) {
            setCurrentDragCanvasId(id);

            // FlexContainer: compute and publish insertion index (rAF-throttled)
            if (componentType === 'FlexContainer') {
              if (!flexRafRef.current) {
                flexRafRef.current = requestAnimationFrame(() => {
                  flexRafRef.current = null;
                  const index = computeFlexInsertIndex(id, clientOffset.x, clientOffset.y, flexDirectionForFlex);
                  setFlexContainerDropTarget({ flexContainerId: id, index });
                });
              }
            }
          }
        }
        // Calculate width based on the app canvas's grid
        let width = (appCanvasWidth * item.component?.defaultSize?.width) / NO_OF_GRIDS;
        const componentSize = {
          width,
          height: item.component?.defaultSize?.height,
        };
        // Activate ghost from any container (main canvas OR modal/sub-canvas) so that
        // dropping a new widget directly into an open modal still produces a visible
        // drag preview - main canvas hover never fires when its drop region is covered
        // by the modal backdrop.
        if (clientOffset) {
          activateMoveableGhost(componentSize, clientOffset, realCanvasRef);
        }
      },
    });

    const showEmptyContainer =
      currentMode === 'edit' &&
      (id === 'canvas' || componentType === 'ModuleContainer') &&
      components.length === 0 &&
      !isDragging;

    function getContainerCanvasWidth() {
      if (canvasWidth !== undefined) {
        if (componentType === 'Listview' && listViewMode == 'grid') return canvasWidth / columns - 2;
        if (id === 'canvas') return canvasWidth;
        return getSubContainerWidthAfterPadding(canvasWidth, componentType, id, realCanvasRef);
      }
      if (componentType === 'canvas-header' || componentType === 'canvas-footer') {
        return realCanvasRef?.current?.offsetWidth - 2 * PAGE_CANVAS_HEADER_FOOTER_PADDING;
      }
      return realCanvasRef?.current?.offsetWidth;
    }

    const containerCanvasWidth = getContainerCanvasWidth();
    const gridWidth = containerCanvasWidth / NO_OF_GRIDS;

    useEffect(() => {
      useGridStore.getState().actions.setSubContainerWidths(id, gridWidth);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridWidth, listViewMode, columns, id]);

    const handleCanvasClick = useCallback(
      (e) => {
        const realCanvas = e.target.closest('.real-canvas');
        const canvasId = realCanvas?.getAttribute('data-parentId');
        setFocusedParentId(canvasId);
        if (realCanvas) {
          const rect = realCanvas.getBoundingClientRect();
          const scrollLeft = realCanvas.scrollLeft || 0;
          const scrollTop = realCanvas.scrollTop || 0;
          const x = e.clientX - rect.left + scrollLeft;
          const y = e.clientY - rect.top + scrollTop;
          setLastCanvasClickPosition({ x, y });
        }
      },
      [setFocusedParentId, setLastCanvasClickPosition]
    );

    /* Due to some reason react-dnd does not identify the dragover element if this element is dynamically removed on drag. 
        Hence display is set to none on dragover and removed only when the component is added */

    const renderEmptyContainer = () => {
      if (components && components?.length !== 0) return;

      const styles = {
        display: showEmptyContainer ? 'block' : 'none',
        ...(componentType === 'ModuleContainer' ? { height: '100%', width: '100%' } : {}),
      };

      return (
        <div style={styles}>
          {componentType === 'ModuleContainer' ? (
            <Suspense fallback={null}>
              <ModuleContainerBlank />
            </Suspense>
          ) : (
            <NoComponentCanvasContainer />
          )}
        </div>
      );
    };
    const sortedComponents = useSortedComponents(components, currentLayout, id, moduleId, isFlexContainer);

    return (
      <div
        ref={(el) => {
          realCanvasRef.current = el;
          drop(el);
        }}
        style={{
          height: id === 'canvas' ? `${canvasHeight}` : getSubContainerHeightAfterPadding(componentType),
          backgroundSize: `${gridWidth}px ${GRID_HEIGHT}px`,
          padding: `${HOVER_CLICK_OUTLINE_BORDER}px`, // This is required to prevent the hover click outline from being cut off
          backgroundColor:
            currentMode === 'view'
              ? computeViewerBackgroundColor(darkMode, canvasBgColor)
              : id === 'canvas'
              ? canvasBgColor
              : '#f0f0f0',
          width: '100%',
          maxWidth: (() => {
            // For Main Canvas
            if (id === 'canvas' || componentType === 'canvas-header' || componentType === 'canvas-footer') {
              return '100%';
            }
            // For Subcontainers
            return canvasWidth;
          })(),
          transform: 'translateZ(0)', //Very very imp --> Hack to make modal position respect canvas container, else it positions w.r.t window.
          ...styles,
          // Prevent the scroll when dragging a widget inside the container or moving out of the container
          overflow: isWidgetInSubContainerDragging ? 'hidden' : undefined,
          ...(id !== 'canvas' && appType !== 'module' && { backgroundColor: 'transparent' }), // Ensure the container's background isn't overridden by the canvas background color.
          ...(isEmbeddedModule && id === moduleId && { backgroundColor: 'transparent' }), // Embedded module root canvas inherits host app background
        }}
        className={cx('real-canvas', {
          'sub-canvas': id !== 'canvas' && appType !== 'module',
          'show-grid': isDragging && (index === 0 || index === null) && currentMode === 'edit' && appType !== 'module',
          'module-container': appType === 'module',
          'is-module-editor': isModuleEditor,
          'has-no-scroll': hasNoScroll,
          'is-child-being-dragged': !hasNoScroll && isWidgetInSubContainerDragging,
          'flex-container-canvas': isFlexContainer,
        })}
        id={id === 'canvas' ? 'real-canvas' : `canvas-${id}`}
        data-cy="real-canvas"
        data-parentId={id}
        canvas-height={canvasHeight}
        onClick={handleCanvasClick}
        component-type={componentType}
      >
        {isFlexContainer ? (
          <>
            {sortedComponents.map((componentId) => (
              <WidgetWrapper
                id={componentId}
                key={componentId}
                currentLayout={currentLayout}
                gridWidth={gridWidth}
                subContainerIndex={index}
                onOptionChange={onOptionChange}
                onOptionsChange={onOptionsChange}
                inCanvas={true}
                readOnly={isContainerReadOnly}
                mode={currentMode}
                darkMode={darkMode}
                moduleId={moduleId}
                parentId={id}
                layoutMode="flex"
                containerWidth={containerCanvasWidth}
                flexDirection={flexDirectionForFlex}
                flexShouldStack={flexShouldStack}
              />
            ))}
            <FlexContainerDropIndicator flexContainerId={id} direction={flexDirectionForFlex} />
          </>
        ) : (
          <>
            <div
              className={cx('container-fluid rm-container p-0', {
                'drag-container-parent': id !== 'canvas',
              })}
              id={allowContainerSelect ? 'select-container' : 'rm-container'}
              component-id={id}
              data-parent-type={id === 'canvas' ? 'canvas' : componentType}
              style={{ height: !showEmptyContainer ? '100%' : 'auto' }} //TODO: remove hardcoded height & canvas condition
            >
              {sortedComponents.map((componentId) => (
                <WidgetWrapper
                  id={componentId}
                  key={componentId}
                  gridWidth={gridWidth}
                  subContainerIndex={index}
                  onOptionChange={onOptionChange}
                  onOptionsChange={onOptionsChange}
                  inCanvas={true}
                  readOnly={isContainerReadOnly}
                  mode={currentMode}
                  currentLayout={currentLayout}
                  darkMode={darkMode}
                  moduleId={moduleId}
                  parentId={id}
                />
              ))}
            </div>
            {renderEmptyContainer()}
          </>
        )}
      </div>
    );
  }
);

Container.displayName = 'Container';

export { Container };
