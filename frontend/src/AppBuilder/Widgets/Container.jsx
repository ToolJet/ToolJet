import React, { useMemo } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { shallow } from 'zustand/shallow';
import { CONTAINER_CANVAS_PADDING, CONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';

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

  const isWidgetInContainerDragging = useStore(
    (state) => state.containerChildrenMapping[id].includes(state.draggingComponentId),
    shallow
  );

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
    border: `${CONTAINER_CANVAS_BORDER_WIDTH}px solid ${borderColor}`,
    height,
    padding: `${CONTAINER_CANVAS_PADDING}px`,
    display: isVisible ? 'flex' : 'none',
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
    // Prevent the scroll when dragging a widget inside the container or moving out of the container
    overflow: isWidgetInContainerDragging ? 'hidden' : 'hidden auto',
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
