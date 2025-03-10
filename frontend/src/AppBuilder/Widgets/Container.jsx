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
  const { borderRadius, borderColor, boxShadow, headerHeight = 80 } = styles;

  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );

  const contentBgColor = useMemo(() => {
    return {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor,
    };
  }, [styles.backgroundColor, darkMode]);

  const headerBgColor = useMemo(() => {
    return {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(styles.headerBackgroundColor) && darkMode
          ? '#232E3C'
          : styles.headerBackgroundColor,
    };
  }, [styles.headerBackgroundColor, darkMode]);

  const computedStyles = {
    backgroundColor: contentBgColor.backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: isVisible ? 'flex' : 'none',
    flexDirection: 'column',
    position: 'relative',
    boxShadow,
  };

  const computedHeaderStyles = {
    ...headerBgColor,
    height: `${headerHeight}px`,
    flexShrink: 0,
    flexGrow: 0,
    borderBottom: `1px solid var(--border-weak)`,
  };

  const computedContentStyles = {
    ...contentBgColor,
    flex: 1,
    overflow: 'auto',
  };

  return (
    <div
      className={`jet-container widget-type-container ${properties.loadingState && 'jet-container-loading'}`}
      id={id}
      data-disabled={isDisabled}
      style={computedStyles}
    >
      {properties.showHeader && (
        <ContainerComponent
          id={`${id}-header`}
          styles={computedHeaderStyles}
          canvasHeight={headerHeight / 10}
          canvasWidth={width}
          allowContainerSelect={true}
          darkMode={darkMode}
        />
      )}
      {isLoading ? (
        <div className="h-100 d-flex align-items-center">
          <Spinner />
        </div>
      ) : (
        <ContainerComponent
          id={id}
          styles={computedContentStyles}
          canvasHeight={height}
          canvasWidth={width}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
