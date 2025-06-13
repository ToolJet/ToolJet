import React, { memo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { DragGhostWidget, ResizeGhostWidget } from './GhostWidgets';
import { ConfigHandle } from './ConfigHandle/ConfigHandle';
import { useGridStore } from '@/_stores/gridStore';
import cx from 'classnames';
import RenderWidget from './RenderWidget';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
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
    const { moduleId } = useModuleContext();
    const calculateMoveableBoxHeightWithId = useStore((state) => state.calculateMoveableBoxHeightWithId, shallow);
    const stylesDefinition = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.styles,
      shallow
    );
    const layoutData = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.layouts?.[currentLayout],
      shallow
    );
    const temporaryLayouts = useStore((state) => state.temporaryLayouts?.[id], shallow);
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
      const componentExposedVisibility = state.getExposedValueOfComponent(id, moduleId)?.isVisible;
      if (componentExposedVisibility === false) return false;
      if (component?.properties?.visibility === false || component?.styles?.visibility === false) return false;
      return true;
    });

    if (!canShowInCurrentLayout || !layoutData) {
      return null;
    }

    let newLayoutData = layoutData;

    if (componentType === 'ModuleContainer' && mode === 'view') {
      newLayoutData = { ...layoutData, top: 0, left: 0, width: NO_OF_GRIDS };
    }

    const width = gridWidth * newLayoutData?.width;
    const height = calculateMoveableBoxHeightWithId(id, currentLayout, stylesDefinition);
    const styles = {
      width: width + 'px',
      height: visibility === false ? '10px' : `${height}px`,
      transform: `translate(${newLayoutData.left * gridWidth}px, ${newLayoutData.top}px)`,
      WebkitFontSmoothing: 'antialiased',
      border: visibility === false && mode === 'edit' ? `1px solid var(--border-default)` : 'none',
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
              widgetTop={temporaryLayouts?.top ?? layoutData.top}
              widgetHeight={temporaryLayouts?.height ?? layoutData.height}
              showHandle={isWidgetActive}
              componentType={componentType}
              visibility={visibility}
              customClassName={isModuleContainer ? 'module-container' : ''}
              isModuleContainer={isModuleContainer}
              subContainerIndex={subContainerIndex}
            />
          )}
          <RenderWidget
            id={id}
            componentType={componentType}
            widgetHeight={newLayoutData.height}
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
