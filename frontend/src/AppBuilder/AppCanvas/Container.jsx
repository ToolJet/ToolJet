/* eslint-disable import/no-named-as-default */
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import cx from 'classnames';
import WidgetWrapper from './WidgetWrapper';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useDrop } from 'react-dnd';
import { addChildrenWidgetsToParent, addNewWidgetToTheEditor, computeViewerBackgroundColor } from './appCanvasUtils';
import { CANVAS_WIDTHS, NO_OF_GRIDS, WIDGETS_WITH_DEFAULT_CHILDREN } from './appCanvasConstants';
import { useGridStore } from '@/_stores/gridStore';
import NoComponentCanvasContainer from './NoComponentCanvasContainer';
import { RIGHT_SIDE_BAR_TAB } from '../RightSideBar/rightSidebarConstants';
import { isPDFSupported } from '@/_helpers/appUtils';
import toast from 'react-hot-toast';

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
  }) => {
    const realCanvasRef = useRef(null);
    const components = useStore((state) => state.getContainerChildrenMapping(id), shallow);
    const componentType = useStore((state) => state.getComponentTypeFromId(id), shallow);
    const addComponentToCurrentPage = useStore((state) => state.addComponentToCurrentPage, shallow);
    const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab, shallow);
    const canvasBgColor = useStore(
      (state) => (id === 'canvas' ? state.getCanvasBackgroundColor('canvas', darkMode) : ''),
      shallow
    );
    const isPagesSidebarHidden = useStore((state) => state.getPagesSidebarVisibility('canvas'), shallow);
    const currentMode = useStore((state) => state.currentMode, shallow);
    const currentLayout = useStore((state) => state.currentLayout, shallow);
    const setFocusedParentId = useStore((state) => state.setFocusedParentId, shallow);
    const isContainerReadOnly = useMemo(() => {
      return (index !== 0 && (componentType === 'Listview' || componentType === 'Kanban')) || currentMode === 'view';
    }, [componentType, index, currentMode]);

    const [{ isOverCurrent }, drop] = useDrop({
      accept: 'box',
      drop: async ({ componentType }, monitor) => {
        const didDrop = monitor.didDrop();
        if (didDrop) return;
        if (componentType === 'PDF' && !isPDFSupported()) {
          toast.error(
            'PDF is not supported in this version of browser. We recommend upgrading to the latest version for full support.'
          );
          return;
        }
        if (WIDGETS_WITH_DEFAULT_CHILDREN.includes(componentType)) {
          const parentComponent = addNewWidgetToTheEditor(componentType, monitor, currentLayout, realCanvasRef, id);
          const childComponents = addChildrenWidgetsToParent(componentType, parentComponent?.id, currentLayout);
          const newComponents = [parentComponent, ...childComponents];
          await addComponentToCurrentPage(newComponents);
          // setSelectedComponents([parentComponent?.id]);
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        } else {
          const newComponent = addNewWidgetToTheEditor(componentType, monitor, currentLayout, realCanvasRef, id);
          await addComponentToCurrentPage([newComponent]);
          // setSelectedComponents([newComponent?.id]);
          setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
        }
      },
      collect: (monitor) => ({
        isOverCurrent: monitor.isOver({ shallow: true }),
      }),
    });

    const showEmptyContainer = currentMode === 'edit' && id === 'canvas' && components.length === 0 && !isOverCurrent;

    function getContainerCanvasWidth() {
      if (canvasWidth !== undefined) {
        if (componentType === 'Listview' && listViewMode == 'grid') return canvasWidth / columns - 2;
        return canvasWidth;
      }
      return realCanvasRef?.current?.offsetWidth;
    }
    const gridWidth = getContainerCanvasWidth() / NO_OF_GRIDS;

    useEffect(() => {
      useGridStore.getState().actions.setSubContainerWidths(id, (getContainerCanvasWidth() - 2) / NO_OF_GRIDS);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasWidth, listViewMode, columns]);

    const getCanvasWidth = useCallback(() => {
      if (
        id === 'canvas' &&
        !isPagesSidebarHidden &&
        isViewerSidebarPinned &&
        currentLayout !== 'mobile' &&
        currentMode !== 'edit'
      ) {
        return `calc(100% - ${pageSidebarStyle === 'icon' ? '65px' : '210px'})`;
      }
      return '100%';
    }, [isViewerSidebarPinned, currentLayout, id, currentMode, pageSidebarStyle]);

    const handleCanvasClick = (e) => {
      const canvasId = e.target.closest('.real-canvas')?.getAttribute('id')?.split('canvas-')[1];
      setFocusedParentId(canvasId);
    };

    console.log(`******************** ${id} ${id !== 'canvas' ? `${canvasHeight}` : ''}`, canvasWidth);

    return (
      <div
        // {...(config.COMMENT_FEATURE_ENABLE && showComments && { onClick: handleAddThread })}
        ref={(el) => {
          realCanvasRef.current = el;
          drop(el);
        }}
        style={{
          height: id === 'canvas' ? `${canvasHeight}` : '100%',
          // backgroundSize: '25.3953px 10px',
          backgroundSize: `${gridWidth}px 10px`,
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
          'show-grid': isOverCurrent && (index === 0 || index === null),
        })}
        id={id === 'canvas' ? 'real-canvas' : `canvas-${id}`}
        data-cy="real-canvas"
        data-parentId={id}
        canvas-height={canvasHeight}
        onClick={handleCanvasClick}
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
          {components.map((id) => (
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

        {/* Due to some reason react-dnd does not identify the dragover element if this element is dynamically removed on drag.
        Hence display is set to none on dragover and removed only when the component is added */}
        {(!components || components?.length === 0) && (
          <div style={{ display: showEmptyContainer ? 'block' : 'none' }}>
            <NoComponentCanvasContainer />
          </div>
        )}
      </div>
    );
  }
);
