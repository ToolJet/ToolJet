import React, { useMemo } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';

export const Container = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
}) => {
  const { borderRadius, borderColor, boxShadow } = styles;

  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );

  const bgColor = useMemo(() => {
    return {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor,
    };
  }, [styles.backgroundColor, darkMode]);

  const computedStyles = {
    backgroundColor: bgColor.backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: isVisible ? 'flex' : 'none',
    overflow: 'hidden auto',
    position: 'relative',
    boxShadow,
  };
  return (
    <div
      className={`jet-container ${isLoading && 'jet-container-loading'}`}
      id={id}
      data-disabled={isDisabled}
      style={computedStyles}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <ContainerComponent id={id} styles={bgColor} canvasHeight={height} canvasWidth={width} darkMode={darkMode} />
      )}
    </div>
  );
};
