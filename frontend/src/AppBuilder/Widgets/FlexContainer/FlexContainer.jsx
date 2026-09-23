import React, { useMemo, useRef } from 'react';
import { Container as ContainerCanvas } from '@/AppBuilder/AppCanvas/Container';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useShouldStackFlexRealCanvas } from './useFlexStackBelow';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Spinner from '@/_ui/Spinner';

export const FlexContainer = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
  adjustComponentPositions,
  currentLayout,
  componentCount = 0,
  currentMode,
  subContainerIndex,
}) => {
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );
  const containerRef = useRef(null);
  // Disabled flex container blocks the mouse via `pointer-events:none`; `inert` also removes the
  // child components from the tab order (runtime only — keeps the builder editable).
  useDisableInert(containerRef, isDisabled);

  const {
    gap,
    padding,
    justifyContent,
    alignItems,
    direction = 'column',
    flexWrap = false,
    stackBelow = 'none',
  } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  const shouldStack = useShouldStackFlexRealCanvas(stackBelow);
  const effectiveDirection = shouldStack ? 'column' : direction;

  const isRow = effectiveDirection === 'row';
  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

  const childIds = useStore((state) => state.containerChildrenMapping?.[id] ?? [], shallow);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    adjustComponentPositions,
    currentLayout,
    isContainer: true,
    componentCount,
    value: useMemo(
      () =>
        JSON.stringify({
          effectiveDirection,
          flexWrap,
          gap,
          padding,
          justifyContent,
          alignItems,
          stackBelow,
          shouldStack,
          childCount: childIds.length,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [effectiveDirection, flexWrap, gap, padding, justifyContent, alignItems, stackBelow, shouldStack, childIds.length]
    ),
    visibility: isVisible,
    subContainerIndex,
  });

  const overflowStyle = isDynamicHeightEnabled
    ? {
        ...(isRow && !flexWrap && !shouldStack ? { overflowX: 'auto' } : {}),
        overflowY: 'visible',
      }
    : shouldStack
    ? { overflowY: 'auto' }
    : flexWrap
    ? {}
    : isRow
    ? { overflowX: 'auto' }
    : { overflowY: 'auto' };

  const outerStyles = {
    height: isDynamicHeightEnabled ? 'auto' : '100%',
    ...(isDynamicHeightEnabled ? { minHeight: `${height}px` } : {}),
    display: isVisible ? 'flex' : 'none',
    flexDirection: effectiveDirection,
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `${SUBCONTAINER_CANVAS_BORDER_WIDTH}px solid ${borderColor}`,
    boxShadow,
    overflow: 'hidden',
    position: 'relative',
  };

  // Flex layout styles are passed into ContainerCanvas and applied to the real-canvas div
  const flexCanvasStyles = {
    display: 'flex',
    flexDirection: effectiveDirection,
    flexWrap: shouldStack ? 'nowrap' : flexWrap ? 'wrap' : 'nowrap',
    gap: `${gap ?? 8}px`,
    padding: `${padding ?? 12}px`,
    justifyContent: justifyContent ?? 'flex-start',
    alignItems: alignItems ?? 'flex-start',
    backgroundColor: 'transparent',
    height: isDynamicHeightEnabled ? 'auto' : '100%',
    ...(isDisabled && { opacity: 0.5, pointerEvents: 'none' }),
    ...overflowStyle,
  };

  return (
    <div
      ref={containerRef}
      style={outerStyles}
      className={`flex-container-widget ${isLoading ? 'jet-container-loading' : ''}`}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <ContainerCanvas
          id={id}
          styles={flexCanvasStyles}
          canvasHeight={height}
          canvasWidth={width}
          darkMode={darkMode}
          componentType="FlexContainer"
          flexEffectiveDirection={effectiveDirection}
          flexShouldStack={shouldStack}
        />
      )}
    </div>
  );
};
