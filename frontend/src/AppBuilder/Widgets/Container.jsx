import React, { useMemo, useState, useEffect } from 'react';
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
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );

  const [verticalBorder, setVerticalBorder] = useState(10);

  useEffect(() => {
    // Set vertical border based on height of the container so that it stays in multitples of 10.
    const remainder = height % 10;
    const adjustment = remainder <= 5 ? remainder : 10 - remainder;
    setVerticalBorder(adjustment / 2); // Padding for one side
  }, [height]);

  const { borderRadius, borderColor, boxShadow, headerHeight = 80 } = styles;
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
    overflow: 'hidden auto',
    position: 'relative',
    boxShadow,
    // padding: `${verticalBorder}px 10px`,
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
      className={`jet-container tw-flex tw-flex-col ${isLoading ? 'jet-container-loading' : ''} ${
        properties.showHeader && 'jet-container--with-header'
      }`}
      id={id}
      data-disabled={isDisabled}
      style={computedStyles}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
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
          <ContainerComponent
            id={id}
            styles={computedContentStyles}
            canvasHeight={height}
            canvasWidth={width}
            darkMode={darkMode}
          />
        </>
      )}
    </div>
  );
};
