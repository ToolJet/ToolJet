import React from 'react';
import { Container as ContainerCanvas } from '@/AppBuilder/AppCanvas/Container';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const FlexContainer = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
  currentLayout,
}) => {
  const { isVisible } = useExposeState(
    false,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );

  const { gap, padding, justify, align, direction = 'column', flexWrap = false } = properties;
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  const isRow = direction === 'row';
  const overflowStyle = flexWrap ? {} : isRow ? { overflowX: 'auto' } : { overflowY: 'auto' };

  const outerStyles = {
    height: '100%',
    display: isVisible ? 'flex' : 'none',
    flexDirection: direction,
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
    flexDirection: direction,
    flexWrap: flexWrap ? 'wrap' : 'nowrap',
    gap: `${gap ?? 8}px`,
    padding: `${padding ?? 12}px`,
    justifyContent: justify ?? 'flex-start',
    alignItems: align ?? 'stretch',
    backgroundColor: 'transparent',
    height: '100%',
    ...overflowStyle,
  };

  return (
    <div style={outerStyles} className="flex-container-widget">
      <ContainerCanvas
        id={id}
        styles={flexCanvasStyles}
        canvasHeight={height}
        canvasWidth={width}
        darkMode={darkMode}
        componentType="FlexContainer"
      />
    </div>
  );
};
