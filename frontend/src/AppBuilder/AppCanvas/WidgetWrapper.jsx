import React, { memo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DragGhostWidget, ResizeGhostWidget } from './GhostWidgets';
import { ConfigHandle } from './ConfigHandle/ConfigHandle';
import { useGridStore } from '@/_stores/gridStore';
import cx from 'classnames';
import RenderWidget from './RenderWidget';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { NO_OF_GRIDS } from './appCanvasConstants';

const WidgetWrapper = memo(
  ({
    id,
    currentLayout = 'desktop',
    gridWidth,
    subContainerIndex,
    onOptionChange,
    onOptionsChange,
    inCanvas = false,
    readOnly,
    mode,
    darkMode,
  }) => {
    const moduleId = useModuleId();
    const calculateMoveableBoxHeightWithId = useStore((state) => state.calculateMoveableBoxHeightWithId, shallow);
    const stylesDefinition = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.styles,
      shallow
    );
    let layoutData = useStore((state) => state.getComponentDefinition(id, moduleId)?.layouts?.[currentLayout], shallow);
    const isWidgetActive = useStore((state) => state.selectedComponents.find((sc) => sc === id) && !readOnly, shallow);
    const isDragging = useStore((state) => state.draggingComponentId === id);
    const isResizing = useGridStore((state) => state.resizingComponentId === id);
    const componentType = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.component,
      shallow
    );
    const setHoveredComponentForGrid = useStore((state) => state.setHoveredComponentForGrid, shallow);
    const canShowInCurrentLayout = useStore((state) => {
      const others = state.getResolvedComponent(id, subContainerIndex, moduleId)?.others;
      return others?.[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'];
    });
    const visibility = useStore((state) => {
      const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
      if (component?.properties?.visibility === false || component?.styles?.visibility === false) return false;
      return true;
    });

    if (!canShowInCurrentLayout || !layoutData) {
      return null;
    }

    // Override layout data with 0 and width to 43 for ModuleContainer in view mode to make the child components relative to the ModuleViewer
    if (componentType === 'ModuleContainer' && mode === 'view') {
      layoutData.top = 0;
      layoutData.left = 0;
      layoutData.width = NO_OF_GRIDS;
    }

    const width = gridWidth * layoutData?.width;
    const height = calculateMoveableBoxHeightWithId(id, currentLayout, stylesDefinition);
    const styles = {
      width: width + 'px',
      height: visibility === false ? '10px' : `${height}px`,
      transform: `translate(${layoutData.left * gridWidth}px, ${layoutData.top}px)`,
      WebkitFontSmoothing: 'antialiased',
      border: visibility === false ? `1px solid var(--border-default)` : 'none',
    };

    const isModuleContainer = componentType === 'ModuleContainer';

    if (!componentType) return null;
    return (
      <>
        <div
          className={cx(`moveable-box ele-${id}`, {
            [`target widget-target target1  moveable-box widget-${id}`]: !readOnly,
            [`widget-${id} nested-target`]: id !== 'canvas' && !readOnly,
            'position-absolute': readOnly,
            'active-target': isWidgetActive,
            'opacity-0': isDragging || isResizing,
            'module-container': isModuleContainer,
          })}
          data-id={`${id}`}
          id={id}
          widgetid={id}
          component-type={componentType}
          style={{
            // zIndex: mode === 'view' && widget.component.component == 'Datepicker' ? 2 : null,
            ...styles,
          }}
          onMouseEnter={() => {
            if (isDragging || isModuleContainer) return;
            setHoveredComponentForGrid(id);
          }}
          onMouseLeave={() => {
            if (isDragging || isModuleContainer) return;
            setHoveredComponentForGrid('');
          }}
        >
          {mode == 'edit' && (
            <ConfigHandle
              id={id}
              widgetTop={layoutData.top}
              widgetHeight={layoutData.height}
              showHandle={isWidgetActive}
              componentType={componentType}
              visibility={visibility}
              customClassName={isModuleContainer ? 'module-container' : ''}
              isModuleContainer={isModuleContainer}
            />
          )}
          <RenderWidget
            id={id}
            componentType={componentType}
            widgetHeight={layoutData.height}
            widgetWidth={width}
            inCanvas={inCanvas}
            subContainerIndex={subContainerIndex}
            onOptionChange={onOptionChange}
            darkMode={darkMode}
            onOptionsChange={onOptionsChange}
          />
        </div>
        <DragGhostWidget isDragging={isDragging} />
        <ResizeGhostWidget isResizing={isResizing} />
      </>
    );
  }
);

export default WidgetWrapper;
