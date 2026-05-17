import React, { memo, useMemo } from 'react';
import cx from 'classnames';
import useStore from '@/AppBuilder/_stores/store';
import useTransientStore from '@/AppBuilder/_stores/transientStore';
import { shallow } from 'zustand/shallow';
import { ConfigHandle } from '@/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { HIDDEN_COMPONENT_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { resolveFlexChildSizing } from './flexContainer.utils';

// TO_DO: Use WidgetWrapper for the child

const FlexContainerChildWrapper = memo(
  ({
    id,
    currentLayout = 'desktop',
    containerWidth,
    onOptionChange,
    onOptionsChange,
    mode,
    darkMode,
    moduleId,
    parentId,
    flexDirection = 'column',
    gridWidth,
    flexShouldStack = false,
  }) => {
    const { contextPath } = useSubcontainerContext();
    const indices = useMemo(() => {
      const result = contextPath.map((s) => s.index);
      return result.length > 0 ? result : null;
    }, [contextPath]);

    const componentType = useStore(
      (state) => state.getComponentDefinition(id, moduleId)?.component?.component,
      shallow
    );
    const layoutData = useStore((state) => state.getComponentDefinition(id, moduleId)?.layouts?.[currentLayout]);
    const isWidgetActive = useStore(
      (state) => state.selectedComponents.find((sc) => sc === id) && mode !== 'view',
      shallow
    );
    const isDragging = useStore((state) => state.draggingComponentId === id);
    const isResizing = useStore((state) => state.resizingComponentId === id);
    const setHoveredComponentForGrid = useTransientStore((state) => state.setHoveredComponentForGrid);
    const getExposedPropertyForAdditionalActions = useStore(
      (state) => state.getExposedPropertyForAdditionalActions,
      shallow
    );

    const canShowInCurrentLayout = useStore((state) => {
      const others = state.getResolvedComponent(id, indices, moduleId)?.others;
      return others?.[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'];
    });

    const visibility = useStore((state) => {
      const component = state.getResolvedComponent(id, indices, moduleId);
      const exposed = getExposedPropertyForAdditionalActions(id, indices, 'isVisible', moduleId);
      if (exposed !== undefined) return exposed;
      return component?.properties?.visibility ?? component?.styles?.visibility;
    });
    const gridDerivedWidthPx = gridWidth * (layoutData?.width ?? 1);

    if (!canShowInCurrentLayout || !layoutData || !componentType) return null;

    const { crossAlignSelf, flexOrder } = layoutData;
    const isRow = flexDirection === 'row';
    const stackedWidthBehavior = layoutData.stackedWidthBehavior ?? 'fill-parent';

    // Resolve per-axis sizing with backward-compat fallback to legacy fillMain/mainSize.
    const { fillWidth, fillHeight, widthPx, heightPx } = resolveFlexChildSizing(layoutData, flexDirection, {
      widthPx: gridDerivedWidthPx,
      heightPx: layoutData.height ?? 100,
    });

    const effectiveWidthPx = widthPx ?? gridDerivedWidthPx ?? 100;
    // Hidden components in edit mode collapse to a fixed visual height; in view mode they fully hide.
    const visibleHeightPx = heightPx ?? layoutData.height ?? 100;
    const effectiveHeightPx = visibility ? visibleHeightPx : mode === 'edit' ? HIDDEN_COMPONENT_HEIGHT : 0;

    const availableWidth = containerWidth ?? effectiveWidthPx;
    let widgetWidth = fillWidth ? availableWidth : effectiveWidthPx;
    const widgetHeight = fillHeight ? effectiveHeightPx : effectiveHeightPx;

    // Main axis is determined by flex direction:
    //   column → main = height, cross = width
    //   row    → main = width,  cross = height
    const mainFill = isRow ? fillWidth : fillHeight;
    const mainPx = isRow ? effectiveWidthPx : effectiveHeightPx;

    if (flexShouldStack && !isRow) {
      if (fillWidth || stackedWidthBehavior === 'fill-parent') {
        widgetWidth = availableWidth;
      } else {
        widgetWidth = Math.min(effectiveWidthPx, availableWidth);
      }
    }

    const styles = {
      ...(flexShouldStack && !isRow
        ? {
            flex: mainFill ? '1 0 auto' : `0 0 ${mainPx}px`,
            height: fillHeight ? '100%' : `${effectiveHeightPx}px`,
            minHeight: 0,
            ...(fillWidth
              ? { width: '100%', minWidth: 0 }
              : stackedWidthBehavior === 'keep-original'
              ? { width: `${effectiveWidthPx}px`, maxWidth: '100%', minWidth: 0 }
              : { width: '100%', minWidth: 0 }),
          }
        : {
            flex: mainFill ? '1 0 auto' : `0 0 ${mainPx}px`,
            ...(isRow
              ? {
                  height: fillHeight ? '100%' : `${effectiveHeightPx}px`,
                  minWidth: 0,
                }
              : {
                  width: fillWidth ? '100%' : `${effectiveWidthPx}px`,
                  minHeight: 0,
                }),
          }),
      alignSelf: crossAlignSelf || undefined,
      // CSS `order` mirrors flexOrder so visual position is always correct even if the
      // React render array is momentarily out of sync (e.g. during optimistic updates).
      order: flexOrder ?? 0,
      position: 'relative',
      display: !visibility && mode === 'view' ? 'none' : 'block',
      boxSizing: 'content-box',
      border: !visibility && mode === 'edit' ? '1px solid var(--border-default)' : 'none',
    };

    return (
      <div
        className={cx(`ele-${id} flex-child-wrapper`, {
          [`target widget-target target1 moveable-box widget-${id}`]: mode !== 'view',
          [`widget-${id} nested-target`]: mode !== 'view',
          'active-target': isWidgetActive,
          'opacity-0 pointer-events-none': isDragging || isResizing,
        })}
        data-id={id}
        id={id}
        widgetid={id}
        component-type={componentType}
        parent-id={parentId}
        style={styles}
        onMouseEnter={() => setHoveredComponentForGrid(id)}
        onMouseLeave={() => setHoveredComponentForGrid('')}
      >
        {mode === 'edit' && (
          <ConfigHandle
            id={id}
            readOnly={false}
            widgetTop={15}
            widgetHeight={layoutData.height}
            showHandle={isWidgetActive}
            componentType={componentType}
            visibility={visibility}
          />
        )}
        <RenderWidget
          id={id}
          componentType={componentType}
          widgetHeight={widgetHeight}
          widgetWidth={widgetWidth}
          inCanvas={true}
          subContainerIndex={null}
          resolveIndex={indices}
          nearestListviewId={null}
          effectiveSubContainerIndex={null}
          onOptionChange={onOptionChange}
          darkMode={darkMode}
          onOptionsChange={onOptionsChange}
          moduleId={moduleId}
          currentMode={mode}
          currentLayout={currentLayout}
        />
      </div>
    );
  }
);

FlexContainerChildWrapper.displayName = 'FlexContainerChildWrapper';

export { FlexContainerChildWrapper };
