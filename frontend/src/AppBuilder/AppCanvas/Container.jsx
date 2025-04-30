/* eslint-disable import/no-named-as-default */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import cx from 'classnames';
import WidgetWrapper from './WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDrop } from 'react-dnd';
import {
  addChildrenWidgetsToParent,
  addNewWidgetToTheEditor,
  computeViewerBackgroundColor,
  getSubContainerWidthAfterPadding,
} from './appCanvasUtils';
import {
  CANVAS_WIDTHS,
  NO_OF_GRIDS,
  WIDGETS_WITH_DEFAULT_CHILDREN,
  GRID_HEIGHT,
  CONTAINER_FORM_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
  BOX_PADDING,
} from './appCanvasConstants';
import { useGridStore } from '@/_stores/gridStore';
import NoComponentCanvasContainer from './NoComponentCanvasContainer';
import { RIGHT_SIDE_BAR_TAB } from '../RightSideBar/rightSidebarConstants';
import { isPDFSupported } from '@/_helpers/appUtils';
import toast from 'react-hot-toast';
import { ModuleContainerBlank } from '@/modules/Modules/components';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import useSortedComponents from '../_hooks/useSortedComponents';

//TODO: Revisit the logic of height (dropRef)

/*
  index - used to identify the subcontainer index
  onOptionChange - used to pass the onOptionChange function to the child components and pass the exposedValues to the parent component
*/
export const Container = React.memo(
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
    isViewerSidebarPinned,
    pageSidebarStyle,
    componentType,
    appType,
  }) => {
    const { moduleId } = useModuleContext();
    const realCanvasRef = useRef(null);
    const components = useStore((state) => state.getContainerChildrenMapping(id, moduleId), shallow);

    const addComponentToCurrentPage = useStore((state) => state.addComponentToCurrentPage, shallow);
    const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
    const setLastCanvasClickPosition = useStore((state) => state.setLastCanvasClickPosition, shallow);
    const canvasBgColor = useStore(
      (state) => (id === 'canvas' ? state.getCanvasBackgroundColor('canvas', darkMode) : ''),
      shallow
    );
    const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
    const currentMode = useStore((state) => state.modeStore.modules[moduleId].currentMode, shallow);
    const currentLayout = useStore((state) => state.currentLayout, shallow);
    const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);

    const isContainerReadOnly = useMemo(() => {
      return (index !== 0 && (componentType === 'Listview' || componentType === 'Kanban')) || currentMode === 'view';
    }, [index, componentType, currentMode]);

    const [{ isOverCurrent }, drop] = useDrop({
      accept: 'box',
      hover: (item) => {
        item.canvasRef = realCanvasRef?.current;
        item.canvasId = id;
        item.canvasWidth = getContainerCanvasWidth();
      },
      drop: async ({ componentType, component }, monitor) => {
        if (appType === 'module' && componentType !== 'ModuleContainer') return;
        const didDrop = monitor.didDrop();
        if (didDrop) return;
        if (componentType === 'PDF' && !isPDFSupported()) {
          toast.error(
            'PDF is not supported in this version of browser. We recommend upgrading to the latest version for full support.'
          );
          return;
        }

        // IMPORTANT: This logic needs to be changed when we implement the module versioning
        const moduleInfo = component?.moduleId
          ? {
              moduleId: component.moduleId,
              versionId: component.versionId,
              environmentId: component.environmentId,
              moduleName: component.displayName,
              moduleContainer: component.moduleContainer,
            }
          : undefined;

        if (WIDGETS_WITH_DEFAULT_CHILDREN.includes(componentType)) {
          const parentComponent = addNewWidgetToTheEditor(
            componentType,
            monitor,
            currentLayout,
            realCanvasRef,
            id,
            moduleInfo
          );
          const childComponents = addChildrenWidgetsToParent(componentType, parentComponent?.id, currentLayout);
          const newComponents = [parentComponent, ...childComponents];
          await addComponentToCurrentPage(newComponents);
          // setSelectedComponents([parentComponent?.id]);
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        } else {
          const newComponent = addNewWidgetToTheEditor(
            componentType,
            monitor,
            currentLayout,
            realCanvasRef,
            id,
            moduleInfo
          );
          await addComponentToCurrentPage([newComponent]);
          // setSelectedComponents([newComponent?.id]);
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }
      },
      collect: (monitor) => ({
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    });

    const showEmptyContainer =
      currentMode === 'edit' &&
      (id === 'canvas' || componentType === 'ModuleContainer') &&
      components.length === 0 &&
      !isOverCurrent;

    function getContainerCanvasWidth() {
      if (canvasWidth !== undefined) {
        if (componentType === 'Listview' && listViewMode == 'grid') return canvasWidth / columns - 2;
        if (id === 'canvas') return canvasWidth;
        return getSubContainerWidthAfterPadding(canvasWidth, componentType, id);
      }
      return realCanvasRef?.current?.offsetWidth;
    }
    const gridWidth = getContainerCanvasWidth() / NO_OF_GRIDS;
    useEffect(() => {
      useGridStore.getState().actions.setSubContainerWidths(id, gridWidth);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasWidth, listViewMode, columns]);

    const getCanvasWidth = useCallback(() => {
      if (
        id === 'canvas' &&
        !isPagesSidebarHidden &&
        isViewerSidebarPinned &&
        currentLayout !== 'mobile' &&
        currentMode !== 'edit' &&
        appType !== 'module'
      ) {
        return `calc(100% - ${pageSidebarStyle === 'icon' ? '65px' : '210px'})`;
      }
      return '100%';
    }, [isViewerSidebarPinned, currentLayout, id, currentMode, pageSidebarStyle]);

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
    const sortedComponents = useSortedComponents(components, currentLayout, id);

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
          width: getCanvasWidth(),
          maxWidth: (() => {
            // For Main Canvas
            if (id === 'canvas') {
              if (currentLayout === 'mobile') {
                return CANVAS_WIDTHS.deviceWindowWidth;
              }
              return canvasMaxWidth;
            }
            // For Subcontainers
            return canvasWidth;
          })(),
          transform: 'translateZ(0)', //Very very imp --> Hack to make modal position respect canvas container, else it positions w.r.t window.
          ...styles,
        }}
        className={cx('real-canvas', {
          'sub-canvas': id !== 'canvas',
          'show-grid': isOverCurrent && (index === 0 || index === null) && currentMode === 'edit',
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
          {sortedComponents.map((id) => (
            <WidgetWrapper
              id={id}
              key={id}
              gridWidth={gridWidth}
              subContainerIndex={index}
              onOptionChange={onOptionChange}
              onOptionsChange={onOptionsChange}
              inCanvas={true}
              readOnly={isContainerReadOnly}
              mode={currentMode}
              currentLayout={currentLayout}
              darkMode={darkMode}
            />
          ))}
        </div>
        {renderEmptyContainer()}
      </div>
    );
  }
);
