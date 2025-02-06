import React, { useMemo } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';

export const Container = ({ id, properties, styles, darkMode, height, width }) => {
  const { visibility, disabledState, borderRadius, borderColor, boxShadow } = styles;
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
    display: visibility ? 'flex' : 'none',
    position: 'relative',
    boxShadow,
  };
  return (
    <div
      className={`jet-container widget-type-container ${properties.loadingState && 'jet-container-loading'}`}
      id={id}
      data-disabled={disabledState}
      style={computedStyles}
    >
      {properties.loadingState ? (
        <Spinner />
      ) : (
        <ContainerComponent id={id} styles={bgColor} canvasHeight={height} canvasWidth={width} darkMode={darkMode} />
      )}
    </div>
  );
};
