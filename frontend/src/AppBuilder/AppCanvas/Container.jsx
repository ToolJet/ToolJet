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
  PAGE_CANVAS_HEADER_FOOTER_PADDING,
  ROW_SCOPED_WIDGET_TYPES,
} from './appCanvasConstants';
import { useGridStore } from '@/_stores/gridStore';
import NoComponentCanvasContainer from './NoComponentCanvasContainer';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useSortedComponents from '../_hooks/useSortedComponents';
import { FlexContainerDropIndicator } from '@/AppBuilder/Widgets/FlexContainer/FlexContainerDropIndicator';
import { useSubCanvasContentWidth } from './Hooks/useSubCanvasContentWidth';

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
    componentType,
    appType,
    hasNoScroll = false,
    flexEffectiveDirection,
    flexShouldStack = false,
  }) => {
    const { moduleId, isModuleEditor, isModuleMode } = useModuleContext();
    const realCanvasRef = useRef(null);
    const components = useStore((state) => state.getContainerChildrenMapping(id, moduleId), shallow);
    const setLastCanvasClickPosition = useStore((state) => state.setLastCanvasClickPosition, shallow);
    const isEmbeddedModule = appType === 'module' && isModuleMode;
    const canvasBgColor = useStore(
      (state) => (id === 'canvas' ? state.getCanvasBackgroundColor('canvas', darkMode) : ''),
      shallow
    );
    const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
    const currentLayout = useStore((state) => state.currentLayout, shallow);
    const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);
    const isFlexContainer = componentType === 'FlexContainer';
    const flexDirection = useStore(
      (state) => (isFlexContainer ? (state.getResolvedComponent?.(id)?.properties?.direction ?? 'column') : 'column'),
      shallow
    );
    const flexDirectionForFlex = isFlexContainer ? (flexEffectiveDirection ?? flexDirection) : flexDirection;

    // Content width of this canvas; the NO_OF_GRIDS columns span it exactly. Computed before the effects
    // below, which list `gridWidth` as a dependency.
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

    // Sub-canvases use their measured content box; the per-widget arithmetic above is only the first-render
    // estimate (it drifted for ListView, Kanban, full-screen modals, FlexContainer...). The main canvas is
    // measured by useCanvasResizing and arrives as `canvasWidth`.
    const measuredCanvasWidth = useSubCanvasContentWidth(realCanvasRef, id !== 'canvas');
    const containerCanvasWidth = measuredCanvasWidth ?? getContainerCanvasWidth();
    // The columns span the content box minus one pixel: the last pixel holds the closing grid line, so the canvas's
    // boundary, its grid lines and the frames of the components on them all fall on the same pixels.
    const gridWidth = Math.max(0, Math.floor(containerCanvasWidth) - 1) / NO_OF_GRIDS;

    const isContainerReadOnly = useMemo(() => {
      return (index !== 0 && ROW_SCOPED_WIDGET_TYPES.includes(componentType)) || currentMode === 'view';
    }, [index, componentType, currentMode]);

    // A drop target for the components panel, so the browser shows a drop is possible. Where a dragged component
    // lands is the canvas interaction engine's business (interaction/engine.js).
    // Only whether a panel drag is on (the empty-canvas placeholder hides then); not its position, which changes on
    // every pointer move and would re-render every canvas.
    const isDragging = useDragLayer((monitor) => monitor.isDragging());
    const [, drop] = useDrop({
      accept: 'box',
      canDrop: () => !isContainerReadOnly,
    });

    const showEmptyContainer =
      currentMode === 'edit' &&
      (id === 'canvas' || componentType === 'ModuleContainer') &&
      components.length === 0 &&
      !isDragging;

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
          // Widgets are placed from the content edge, so start the grid-line pattern there too.
          backgroundOrigin: 'content-box',
          // No padding: the grid fills the canvas, its closing line on the last pixel, and every frame is drawn
          // inside its own box (interaction.scss), so nothing needs room around the grid.
          padding: 0,
          backgroundColor:
            currentMode === 'view'
              ? computeViewerBackgroundColor(darkMode, canvasBgColor)
              : id === 'canvas'
                ? canvasBgColor
                : 'var(--canvas-subcontainer-background)',
          // Width: the slot its widget gives it, to a whole pixel (appCanvas.scss, .real-canvas).
          transform: 'translateZ(0)', //Very very imp --> Hack to make modal position respect canvas container, else it positions w.r.t window.
          ...styles,
          ...(id !== 'canvas' && appType !== 'module' && { backgroundColor: 'transparent' }), // Ensure the container's background isn't overridden by the canvas background color.
          ...(isEmbeddedModule && id === moduleId && { backgroundColor: 'transparent' }), // Embedded module root canvas inherits host app background
        }}
        className={cx('real-canvas', {
          'sub-canvas': id !== 'canvas' && appType !== 'module',
          'module-container': appType === 'module',
          'is-module-editor': isModuleEditor,
          'has-no-scroll': hasNoScroll,
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
