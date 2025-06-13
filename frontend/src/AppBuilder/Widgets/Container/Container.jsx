import React, { useMemo } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { shallow } from 'zustand/shallow';
import {
  CONTAINER_FORM_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import useStore from '@/AppBuilder/_stores/store';
import './container.scss';

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
    (state) => state.containerChildrenMapping?.[id]?.includes(state?.draggingComponentId),
    shallow
  );

  const { borderRadius, borderColor, boxShadow } = styles;
  const { headerHeight = 80 } = properties;
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
    border: `${SUBCONTAINER_CANVAS_BORDER_WIDTH}px solid ${borderColor}`,
    height,
    display: isVisible ? 'flex' : 'none',
    flexDirection: 'column',
    position: 'relative',
    boxShadow,
  };

  const containerHeaderStyles = {
    flexShrink: 0,
    padding: `${CONTAINER_FORM_CANVAS_PADDING}px ${CONTAINER_FORM_CANVAS_PADDING}px 3px ${CONTAINER_FORM_CANVAS_PADDING}px`,
    ...headerBgColor,
  };
  const containerContentStyles = {
    overflow: 'hidden auto',
    display: 'flex',
    height: '100%',
    padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
  };

  return (
    <div
      className={`jet-container ${isLoading ? 'jet-container-loading' : ''}`}
      id={id}
      data-disabled={isDisabled}
      style={computedStyles}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {properties.showHeader && (
            <div style={containerHeaderStyles} className="wj-container-header">
              <ContainerComponent
                id={`${id}-header`}
                styles={{ ...headerBgColor, height: `${headerHeight}px` }}
                canvasHeight={headerHeight / 10}
                canvasWidth={width}
                allowContainerSelect={true}
                darkMode={darkMode}
                componentType="Container"
              />
            </div>
          )}
          <div style={containerContentStyles}>
            <ContainerComponent
              id={id}
              styles={{
                ...contentBgColor,
                // Prevent the scroll when dragging a widget inside the container or moving out of the container
                overflow: isWidgetInContainerDragging ? 'hidden' : 'hidden auto',
              }}
              canvasHeight={height}
              canvasWidth={width}
              darkMode={darkMode}
              componentType="Container"
            />
          </div>
        </>
      )}
    </div>
  );
};
