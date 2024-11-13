import React, { useMemo } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';

export const Container = ({ id, properties, styles, darkMode, height, width }) => {
  const { visibility, disabledState, borderRadius, borderColor, boxShadow, headerHeight = 80 } = styles;
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
    display: visibility ? 'flex' : 'none',
    overflow: 'hidden auto',
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
      className={`jet-container tw-flex tw-flex-col ${properties.loadingState && 'jet-container-loading'} ${
        properties.showHeader && 'jet-container--with-header'
      }`}
      id={id}
      data-disabled={disabledState}
      style={computedStyles}
    >
      {properties.loadingState ? (
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
