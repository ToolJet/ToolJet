import React, { memo, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { ConfigHandle } from './ConfigHandle/ConfigHandle';
import cx from 'classnames';
import RenderWidget from './RenderWidget';
import { NO_OF_GRIDS } from './appCanvasConstants';
import { isTruthyOrZero } from '@/_helpers/appUtils';

const DYNAMIC_HEIGHT_AUTO_LIST = ['CodeEditor', 'Listview', 'TextArea', 'TagsInput'];

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
    moduleId,
    parentId,
  }) => {
    const calculateMoveableBoxHeightWithId = useStore((state) => state.calculateMoveableBoxHeightWithId, shallow);
    const incrementCanvasUpdater = useStore((state) => state.incrementCanvasUpdater, shallow);
    const stylesDefinition = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.styles,
      shallow
    );
    const layoutData = useStore((state) => state.getComponentDefinition(id, moduleId)?.layouts?.[currentLayout]);
    const temporaryLayouts = useStore((state) => {
      let transformedId = id;
      if (subContainerIndex || subContainerIndex === 0) {
        transformedId = `${id}-${subContainerIndex}`;
      }
      return state.temporaryLayouts?.[transformedId];
    }, shallow);
    const getExposedPropertyForAdditionalActions = useStore(
      (state) => state.getExposedPropertyForAdditionalActions,
      shallow
    );

    const isWidgetActive = useStore((state) => state.selectedComponents.find((sc) => sc === id) && !readOnly, shallow);
    const isDragging = useStore((state) => state.draggingComponentId === id);
    const isResizing = useStore((state) => state.resizingComponentId === id);
    const componentType = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.component,
      shallow
    );
    const isDynamicHeightEnabled = useStore(
      (state) => state.getResolvedComponent(id, subContainerIndex, moduleId)?.properties?.dynamicHeight,
      shallow
    );
    const isDynamicHeightEnabledInModeView = isDynamicHeightEnabled && mode === 'view';
    // Dont remove this is being used to re-render the height calculations
    const label = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.properties?.label
    );

    const setHoveredComponentForGrid = useStore((state) => state.setHoveredComponentForGrid, shallow);
    const canShowInCurrentLayout = useStore((state) => {
      const others = state.getResolvedComponent(id, subContainerIndex, moduleId)?.others;
      return others?.[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'];
    });

    const visibility = useStore((state) => {
      const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
      const componentExposedVisibility = getExposedPropertyForAdditionalActions(
        id,
        subContainerIndex,
        'isVisible',
        moduleId
      );
      if (componentExposedVisibility !== undefined) return componentExposedVisibility;
      return component?.properties?.visibility || component?.styles?.visibility;
    });

    useEffect(() => {
      incrementCanvasUpdater();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibility]);

    if (!canShowInCurrentLayout || !layoutData) {
      return null;
    }

    let newLayoutData = layoutData;

    if (componentType === 'ModuleContainer' && mode === 'view') {
      newLayoutData = { ...layoutData, top: 0, left: 0, width: NO_OF_GRIDS };
    }

    const width = gridWidth * newLayoutData?.width;
    const height = calculateMoveableBoxHeightWithId(id, currentLayout, stylesDefinition);

    // Calculate the final height based on visibility and temporary layouts
    const finalHeight = visibility ? temporaryLayouts?.height ?? height : 10;

    // Sets height to auto for subcontainer or listview if dynamic height is enabled
    const styles = {
      width: width + 'px',
      height:
        isDynamicHeightEnabledInModeView &&
        (isTruthyOrZero(subContainerIndex) || DYNAMIC_HEIGHT_AUTO_LIST.includes(componentType))
          ? 'auto'
          : finalHeight + 'px',
      transform: `translate(${newLayoutData.left * gridWidth}px, ${temporaryLayouts?.top ?? newLayoutData.top}px)`,
      WebkitFontSmoothing: 'antialiased',
      border: !visibility && mode === 'edit' ? `1px solid var(--border-default)` : 'none',
      boxSizing: 'content-box',
      display: !visibility && mode === 'view' ? 'none' : 'block',
    };

    const isModuleContainer = componentType === 'ModuleContainer';

    if (!componentType) return null;
    return (
      <>
        <div
          className={cx(`ele-${id}`, {
            [`target widget-target target1  moveable-box widget-${id}`]: !readOnly,
            [`widget-${id} nested-target`]: id !== 'canvas' && !readOnly,
            'position-absolute': readOnly,
            'active-target': isWidgetActive,
            'opacity-0 pointer-events-none': isDragging || isResizing,
            'module-container': isModuleContainer,
            'dynamic-height-target': isDynamicHeightEnabled,
          })}
          data-id={`${id}`}
          id={id}
          widgetid={id}
          component-type={componentType}
          parent-id={parentId}
          subcontainer-id={subContainerIndex}
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
              readOnly={readOnly}
              widgetTop={temporaryLayouts?.top ?? layoutData.top}
              widgetHeight={temporaryLayouts?.height ?? layoutData.height}
              showHandle={isWidgetActive}
              componentType={componentType}
              visibility={visibility}
              customClassName={isModuleContainer ? 'module-container' : ''}
              isModuleContainer={isModuleContainer}
              subContainerIndex={subContainerIndex}
              isDynamicHeightEnabled={isDynamicHeightEnabled}
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
            moduleId={moduleId}
            currentMode={mode}
          />
        </div>
      </>
    );
  }
);

WidgetWrapper.displayName = 'WidgetWrapper';

export default WidgetWrapper;
