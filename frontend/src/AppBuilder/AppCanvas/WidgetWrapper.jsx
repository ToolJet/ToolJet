import React, { memo, useEffect, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import useTransientStore from '@/AppBuilder/_stores/transientStore';
import { shallow } from 'zustand/shallow';
import { ConfigHandle } from './ConfigHandle/ConfigHandle';
import cx from 'classnames';
import RenderWidget from './RenderWidget';
import { NO_OF_GRIDS, HIDDEN_COMPONENT_HEIGHT } from './appCanvasConstants';
import { isTruthyOrZero } from '@/_helpers/appUtils';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { getDynamicLayoutKey, serializeLayoutContext } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const DYNAMIC_HEIGHT_AUTO_LIST = [
  'CodeEditor',
  'Listview',
  'TextArea',
  'TagsInput',
  'TreeSelect',
  'KeyValuePair',
  'JSONExplorer',
  'JSONEditor',
  'RichTextEditor',
  'Text',
  'Table',
];

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
    const { contextPath } = useSubcontainerContext();
    const indices = useMemo(() => {
      const result = contextPath.map((s) => s.index);
      return result.length > 0 ? result : null;
    }, [contextPath]);
    // Use full indices array for resolved component lookups, keep subContainerIndex for DOM/layout
    const resolveIndex = indices ?? subContainerIndex;

    // Derive nearest ListView ancestor ID and effective row index from contextPath (no store access needed)
    const nearestListviewId = useMemo(() => {
      if (contextPath.length === 0) return null;
      return contextPath[contextPath.length - 1].containerId;
    }, [contextPath]);

    const effectiveSubContainerIndex = useMemo(() => {
      if (subContainerIndex != null) return subContainerIndex;
      if (contextPath.length > 0) return contextPath[contextPath.length - 1].index;
      return null;
    }, [subContainerIndex, contextPath]);

    const calculateMoveableBoxHeightWithId = useStore((state) => state.calculateMoveableBoxHeightWithId, shallow);
    const debouncedIncrementCanvasUpdater = useStore((state) => state.debouncedIncrementCanvasUpdater, shallow);
    const stylesDefinition = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.styles,
      shallow
    );
    const layoutData = useStore((state) => state.getComponentDefinition(id, moduleId)?.layouts?.[currentLayout]);
    const temporaryLayouts = useStore((state) => {
      const layoutContext = indices ?? subContainerIndex;
      return state.temporaryLayouts?.[getDynamicLayoutKey(id, layoutContext)];
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
      (state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.properties?.dynamicHeight,
      shallow
    );
    const isDynamicHeightEnabledInModeView = isDynamicHeightEnabled && mode === 'view';
    // Dont remove this is being used to re-render the height calculations
    const _label = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.properties?.label
    );
    // Dont remove - used to re-render height calculations when textSize changes (ProgressBar)
    // eslint-disable-next-line no-unused-vars
    const textSize = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.definition?.styles?.textSize
    );

    const setHoveredComponentForGrid = useTransientStore((state) => state.setHoveredComponentForGrid);
    const canShowInCurrentLayout = useStore((state) => {
      const others = state.getResolvedComponent(id, resolveIndex, moduleId)?.others;
      return others?.[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'];
    });

    const visibility = useStore((state) => {
      const component = state.getResolvedComponent(id, resolveIndex, moduleId);
      const componentExposedVisibility = getExposedPropertyForAdditionalActions(
        id,
        resolveIndex,
        'isVisible',
        moduleId
      );
      if (componentExposedVisibility !== undefined) return componentExposedVisibility;
      return component?.properties?.visibility || component?.styles?.visibility;
    });

    useEffect(() => {
      debouncedIncrementCanvasUpdater();
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
    const height = calculateMoveableBoxHeightWithId(id, currentLayout, stylesDefinition, moduleId);

    // Calculate the final height based on visibility and temporary layouts.
    // Hidden widgets collapse to 0 in both edit and view modes — in edit mode
    // a 1px dashed top border (set below) marks the widget's authored position
    // so designers can still locate it; the floating ConfigHandle stays
    // clickable above the collapsed slot. In view mode display:none is set.
    const finalHeight = visibility ? temporaryLayouts?.height ?? height : HIDDEN_COMPONENT_HEIGHT;
    const layoutContext = indices ?? subContainerIndex;
    const serializedLayoutContext = serializeLayoutContext(layoutContext);

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
      borderTop: !visibility && mode === 'edit' ? `1px dashed var(--border-accent-strong)` : 'none',
      boxSizing: 'content-box',
      display: !visibility && mode === 'view' ? 'none' : 'block',
    };

    const isModuleContainer = componentType === 'ModuleContainer';
    const isModuleViewerWidget = componentType === 'ModuleViewer';

    // Capture phase fires before the embedded widget can consume the click, so a
    // click anywhere inside the module reliably opens the configuration sidebar.
    // Widgets embedded inside a module render read-only and are not Moveable
    // targets, so clicking them never fires Moveable's `onClick` (the path that
    // opens the right sidebar) — react-moveable derives `onClick` from its gesto
    // drag-end, which never starts on interactive child elements.
    const handleModuleClickCapture = (e) => {
      if (e.shiftKey) return; // don't interfere with shift multi-select
      const { setActiveRightSideBarTab, setRightSidebarOpen } = useStore.getState();
      setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
      setRightSidebarOpen(true);
    };

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
          data-layout-context={serializedLayoutContext}
          style={{
            // zIndex: mode === 'view' && widget.component.component == 'Datepicker' ? 2 : null,
            ...styles,
          }}
          onClickCapture={isModuleViewerWidget && mode === 'edit' ? handleModuleClickCapture : undefined}
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
            widgetHeight={!visibility && mode === 'edit' ? HIDDEN_COMPONENT_HEIGHT : newLayoutData.height}
            widgetWidth={width}
            inCanvas={inCanvas}
            subContainerIndex={subContainerIndex}
            resolveIndex={resolveIndex}
            nearestListviewId={nearestListviewId}
            effectiveSubContainerIndex={effectiveSubContainerIndex}
            onOptionChange={onOptionChange}
            darkMode={darkMode}
            onOptionsChange={onOptionsChange}
            moduleId={moduleId}
            currentMode={mode}
            currentLayout={currentLayout}
          />
        </div>
      </>
    );
  }
);

WidgetWrapper.displayName = 'WidgetWrapper';

export default WidgetWrapper;
