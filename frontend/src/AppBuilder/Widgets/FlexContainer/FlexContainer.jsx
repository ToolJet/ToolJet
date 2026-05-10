import React from 'react';
import { Container as ContainerCanvas } from '@/AppBuilder/AppCanvas/Container';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useShouldStackFlexRealCanvas } from './useFlexStackBelow';

export const FlexContainer = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
}) => {
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );

  const { gap, padding, justify, align, direction = 'column', flexWrap = false, stackBelow = 'none' } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  const shouldStack = useShouldStackFlexRealCanvas(stackBelow);
  const effectiveDirection = shouldStack ? 'column' : direction;

  const isRow = effectiveDirection === 'row';
  const overflowStyle = shouldStack
    ? { overflowY: 'auto' }
    : flexWrap
    ? {}
    : isRow
    ? { overflowX: 'auto' }
    : { overflowY: 'auto' };

  const outerStyles = {
    height: '100%',
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
    justifyContent: justify ?? 'flex-start',
    alignItems: align ?? 'stretch',
    backgroundColor: 'transparent',
    height: '100%',
    ...(isDisabled && { opacity: 0.5, pointerEvents: 'none' }),
    ...overflowStyle,
  };

  return (
    <div style={outerStyles} className={`flex-container-widget ${isLoading ? 'jet-container-loading' : ''}`}>
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
    </div>
  );
};
