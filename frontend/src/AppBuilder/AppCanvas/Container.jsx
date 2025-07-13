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
  addDefaultButtonIdToForm,
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
import { noop } from 'lodash';

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
    isViewerSidebarPinned,
    pageSidebarStyle,
    pagePositionType,
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
    const setShowModuleBorder = useStore((state) => state.setShowModuleBorder, shallow) || noop;

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
        setShowModuleBorder(false);
        if (currentMode === 'view' || (appType === 'module' && componentType !== 'ModuleContainer')) return;

        const didDrop = monitor.didDrop();
        if (didDrop) return;

        const moduleInfo = component?.moduleId
          ? {
              moduleId: component.moduleId,
              versionId: component.versionId,
              environmentId: component.environmentId,
              moduleName: component.displayName,
              moduleContainer: component.moduleContainer,
            }
          : undefined;

        let addedComponent;

        if (WIDGETS_WITH_DEFAULT_CHILDREN.includes(componentType)) {
          let parentComponent = addNewWidgetToTheEditor(
            componentType,
            monitor,
            currentLayout,
            realCanvasRef,
            id,
            moduleInfo
          );
          const childComponents = addChildrenWidgetsToParent(componentType, parentComponent?.id, currentLayout);
          if (componentType === 'Form') {
            parentComponent = addDefaultButtonIdToForm(parentComponent, childComponents);
          }
          addedComponent = [parentComponent, ...childComponents];
          await addComponentToCurrentPage(addedComponent);
        } else {
          const newComponent = addNewWidgetToTheEditor(
            componentType,
            monitor,
            currentLayout,
            realCanvasRef,
            id,
            moduleInfo
          );
          addedComponent = [newComponent];
          await addComponentToCurrentPage(addedComponent);
        }

        setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

        const canvas = document.querySelector('.canvas-container');
        const sidebar = document.querySelector('.editor-sidebar');
        const droppedElem = document.getElementById(addedComponent?.[0]?.id);

        if (!canvas || !sidebar || !droppedElem) return;

        const droppedRect = droppedElem.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        const isOverlapping = droppedRect.right > sidebarRect.left && droppedRect.left < sidebarRect.right;

        if (isOverlapping) {
          const overlap = droppedRect.right - sidebarRect.left;
          canvas.scrollTo({
            left: canvas.scrollLeft + overlap,
            behavior: 'smooth',
          });
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
        return getSubContainerWidthAfterPadding(canvasWidth, componentType, id, realCanvasRef);
      }
      return realCanvasRef?.current?.offsetWidth;
    }

    const gridWidth = getContainerCanvasWidth() / NO_OF_GRIDS;
    useEffect(() => {
      useGridStore.getState().actions.setSubContainerWidths(id, gridWidth);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasWidth, listViewMode, columns]);

    const getCanvasWidth = useCallback(() => {
      // if (
      //   id === 'canvas' &&
      //   !isPagesSidebarHidden &&
      //   isViewerSidebarPinned &&
      //   currentLayout !== 'mobile' &&
      //   pagePositionType == 'side' &&
      //   appType !== 'module'
      // ) {
      //   return `calc(100% - ${pageSidebarStyle === 'icon' ? '85px' : '226px'})`;
      // }
      // if (
      //   id === 'canvas' &&
      //   !isPagesSidebarHidden &&
      //   !isViewerSidebarPinned &&
      //   currentLayout !== 'mobile' &&
      //   pagePositionType == 'side'
      // ) {
      //   return `calc(100% - ${'44px'})`;
      // }
      return '100%';
    }, [id, isPagesSidebarHidden, isViewerSidebarPinned, currentLayout, pagePositionType, pageSidebarStyle]);

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
              return canvasMaxWidth;
            }
            // For Subcontainers
            return canvasWidth;
          })(),
          transform: 'translateZ(0)', //Very very imp --> Hack to make modal position respect canvas container, else it positions w.r.t window.
          ...styles,
        }}
        className={cx('real-canvas', {
          'sub-canvas': id !== 'canvas' && appType !== 'module',
          'show-grid':
            isOverCurrent && (index === 0 || index === null) && currentMode === 'edit' && appType !== 'module',
          'module-container': appType === 'module',
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
              moduleId={moduleId}
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
