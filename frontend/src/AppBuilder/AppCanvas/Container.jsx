/* eslint-disable import/no-named-as-default */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import cx from 'classnames';
import WidgetWrapper from './WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDrop, useDragLayer } from 'react-dnd';
import { computeViewerBackgroundColor, getSubContainerWidthAfterPadding } from './appCanvasUtils';
import { CANVAS_WIDTHS, NO_OF_GRIDS, GRID_HEIGHT } from './appCanvasConstants';
import { useGridStore } from '@/_stores/gridStore';
import NoComponentCanvasContainer from './NoComponentCanvasContainer';
import { ModuleContainerBlank } from '@/modules/Modules/components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useSortedComponents from '../_hooks/useSortedComponents';
import { useDropVirtualMoveableGhost } from './Grid/hooks/useDropVirtualMoveableGhost';
import { useCanvasDropHandler } from './useCanvasDropHandler';
import { findNewParentIdFromMousePosition } from './Grid/gridUtils';

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
    canvasMaxWidth,
    componentType,
    appType,
  }) => {
    const { moduleId, isModuleEditor } = useModuleContext();
    const realCanvasRef = useRef(null);
    const components = useStore((state) => state.getContainerChildrenMapping(id, moduleId), shallow);
    const setLastCanvasClickPosition = useStore((state) => state.setLastCanvasClickPosition, shallow);
    const canvasBgColor = useStore(
      (state) => (id === 'canvas' ? state.getCanvasBackgroundColor('canvas', darkMode) : ''),
      shallow
    );
    const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
    const currentLayout = useStore((state) => state.currentLayout, shallow);
    const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);

    // Initialize ghost moveable hook
    const { activateMoveableGhost, deactivateMoveableGhost } = useDropVirtualMoveableGhost();

    // // Monitor drag layer to update ghost position continuously
    const { isDragging } = useDragLayer((monitor) => ({
      isDragging: monitor.isDragging(),
    }));

    // // // Cleanup ghost when drag ends
    useEffect(() => {
      if (!isDragging) {
        deactivateMoveableGhost();
      }
    }, [id, isDragging, deactivateMoveableGhost]);

    const isContainerReadOnly = useMemo(() => {
      return (index !== 0 && (componentType === 'Listview' || componentType === 'Kanban')) || currentMode === 'view';
    }, [index, componentType, currentMode]);

    const setCurrentDragCanvasId = useGridStore((state) => state.actions.setCurrentDragCanvasId);

    const { handleDrop } = useCanvasDropHandler({
      appType,
    });

    const [{ isOverCurrent }, drop] = useDrop({
      accept: 'box',
      hover: (item, monitor) => {
        const clientOffset = monitor.getClientOffset();

        const appCanvasWidth = realCanvasRef?.current?.offsetWidth || 0;

        if (clientOffset) {
          const canvasId = findNewParentIdFromMousePosition(clientOffset.x, clientOffset.y, id);
          if (canvasId === id) {
            setCurrentDragCanvasId(id);
          }
        }
        // Calculate width based on the app canvas's grid
        let width = (appCanvasWidth * item.component?.defaultSize?.width) / NO_OF_GRIDS;
        const componentSize = {
          width,
          height: item.component?.defaultSize?.height,
        };
        if (clientOffset && id === 'canvas') {
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
      return realCanvasRef?.current?.offsetWidth;
    }

    const gridWidth = getContainerCanvasWidth() / NO_OF_GRIDS;

    useEffect(() => {
      useGridStore.getState().actions.setSubContainerWidths(id, gridWidth);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasWidth, listViewMode, columns]);

    const handleCanvasClick = useCallback(
      (e) => {
        const realCanvas = e.target.closest('.real-canvas');
        const canvasId = realCanvas?.getAttribute('id')?.split('canvas-')[1];
        setFocusedParentId(canvasId);
        if (realCanvas) {
          const rect = realCanvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setLastCanvasClickPosition({ x, y });
        }
      },
      [setLastCanvasClickPosition]
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
          {componentType === 'ModuleContainer' ? <ModuleContainerBlank /> : <NoComponentCanvasContainer />}
        </div>
      );
    };
    const sortedComponents = useSortedComponents(components, currentLayout, id, moduleId);
    return (
      <div
        // {...(config.COMMENT_FEATURE_ENABLE && showComments && { onClick: handleAddThread })}
        ref={(el) => {
          realCanvasRef.current = el;
          drop(el);
        }}
        style={{
          height: id === 'canvas' ? `${canvasHeight}` : '100%',
          backgroundSize: `${gridWidth}px ${GRID_HEIGHT}px`,
          backgroundColor:
            currentMode === 'view'
              ? computeViewerBackgroundColor(darkMode, canvasBgColor)
              : id === 'canvas'
              ? canvasBgColor
              : '#f0f0f0',
          width: '100%',
          maxWidth: (() => {
            // For Main Canvas
            if (id === 'canvas') {
              if (currentLayout === 'mobile') {
                return CANVAS_WIDTHS.deviceWindowWidth;
              }
              if (currentMode === 'view') {
                return '100%';
              } else {
                return canvasMaxWidth;
              }
            }
            // For Subcontainers
            return canvasWidth;
          })(),
          transform: 'translateZ(0)', //Very very imp --> Hack to make modal position respect canvas container, else it positions w.r.t window.
          ...styles,
          ...(id !== 'canvas' && appType !== 'module' && { backgroundColor: 'transparent' }), // Ensure the container's background isn't overridden by the canvas background color.
        }}
        className={cx('real-canvas', {
          'sub-canvas': id !== 'canvas' && appType !== 'module',
          'show-grid': isDragging && (index === 0 || index === null) && currentMode === 'edit' && appType !== 'module',
          'module-container': appType === 'module',
          'is-module-editor': isModuleEditor,
        })}
        id={id === 'canvas' ? 'real-canvas' : `canvas-${id}`}
        data-cy="real-canvas"
        data-parentId={id}
        canvas-height={canvasHeight}
        onClick={handleCanvasClick}
        component-type={componentType}
      >
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
      </div>
    );
  }
);

Container.displayName = 'Container';

export { Container };
