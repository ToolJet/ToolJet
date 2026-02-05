import React, { useEffect, useMemo, useState } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import {
  CONTAINER_FORM_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import './accordion.scss';
import Header from './components/Header';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

export const Accordion = ({
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
  fireEvent,
}) => {
  const { headerHeight = 80, showHeader, dynamicHeight, loadingState, visibility, disabledState } = properties;
  const { borderRadius, borderColor, boxShadow, headerDividerColor, chevronIconColor } = styles;

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isDisabled: disabledState,
    isLoading: loadingState,
    isExpanded: true, // State for expanding/collapsing accordion component
  });

  // Helpers
  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // Dynamic height - always enable position adjustments in view mode for accordion
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const shouldAdjustPositions = currentMode === 'view';
  useDynamicHeight({
    isDynamicHeightEnabled: shouldAdjustPositions,
    id,
    height,
    adjustComponentPositions,
    currentLayout,
    isContainer: true,
    componentCount,
    value: JSON.stringify({ headerHeight, showHeader, isExpanded: exposedVariablesTemporaryState.isExpanded }),
    visibility: exposedVariablesTemporaryState.isVisible,
    subContainerIndex,
  });

  // Effects
  useEffect(() => {
    setExposedVariables({
      ...exposedVariablesTemporaryState,
      expand: async function () {
        setExposedVariable('isExpanded', true);
        updateExposedVariablesState('isExpanded', true);
        fireEvent('onExpand');
      },
      collapse: async function () {
        setExposedVariable('isExpanded', false);
        updateExposedVariablesState('isExpanded', false);
        fireEvent('onCollapse');
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', !!value);
        updateExposedVariablesState('isLoading', !!value);
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        updateExposedVariablesState('isVisible', !!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        updateExposedVariablesState('isDisabled', !!value);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBatchedUpdateEffectArray([
    {
      dep: exposedVariablesTemporaryState.isExpanded,
      sideEffect: () => {
        setExposedVariable('isExpanded', exposedVariablesTemporaryState.isExpanded);
      },
    },
    {
      dep: loadingState,
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  // Styles
  const contentBgColor = useMemo(() => {
    return {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(styles.backgroundColor) && darkMode ? '#232E3C' : styles.backgroundColor,
    };
  }, [styles.backgroundColor, darkMode]);

  const computedStyles = {
    backgroundColor: contentBgColor.backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `${SUBCONTAINER_CANVAS_BORDER_WIDTH}px solid ${borderColor}`,
    ...(isDynamicHeightEnabled && exposedVariablesTemporaryState.isExpanded && { minHeight: `${height}px` }),
    height: !exposedVariablesTemporaryState.isExpanded
      ? headerHeight + CONTAINER_FORM_CANVAS_PADDING + 3 + 2 // 3 for bottom padding and 2 for top-bottom border
      : isDynamicHeightEnabled
      ? '100%'
      : height,
    display:
      exposedVariablesTemporaryState.isVisible && (showHeader || exposedVariablesTemporaryState.isExpanded)
        ? 'flex'
        : 'none',
    flexDirection: 'column',
    position: 'relative',
    boxShadow,
    '--cc-accordion-header-divider-color': headerDividerColor,
  };

  const accordionContentStyles = useMemo(() => {
    return {
      display: 'flex',
      height: '100%',
      padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
      ...(exposedVariablesTemporaryState.isDisabled && {
        opacity: 0.5,
        pointerEvents: 'none',
      }),
    };
  }, [exposedVariablesTemporaryState.isDisabled]);

  return (
    <div
      className={`jet-container ${exposedVariablesTemporaryState.isLoading ? 'jet-container-loading' : ''} ${
        exposedVariablesTemporaryState.isExpanded ? 'jet-container-expanded' : 'jet-container-collapsed'
      }`}
      id={id}
      data-disabled={exposedVariablesTemporaryState.isDisabled}
      style={computedStyles}
    >
      {exposedVariablesTemporaryState.isLoading ? (
        <Spinner />
      ) : (
        <>
          {showHeader && (
            <Header
              id={id}
              height={height}
              width={width}
              isDynamicHeightEnabled={isDynamicHeightEnabled}
              headerBackgroundColor={styles.headerBackgroundColor}
              darkMode={darkMode}
              borderRadius={borderRadius}
              headerHeight={headerHeight}
              isExpanded={exposedVariablesTemporaryState.isExpanded}
              setExpanded={(expand) => updateExposedVariablesState('isExpanded', expand)}
              fireEvent={fireEvent}
              isDisabled={exposedVariablesTemporaryState.isDisabled}
              chevronIconColor={chevronIconColor}
            />
          )}
          {exposedVariablesTemporaryState.isExpanded && (
            <div
              style={accordionContentStyles}
              className={`${dynamicHeight && `dynamic-${id}`} widget-type-container`}
              data-disabled={exposedVariablesTemporaryState.isDisabled}
            >
              <ContainerComponent
                id={id}
                styles={{
                  ...contentBgColor,
                  borderRadius: `${borderRadius}px`,
                }}
                canvasHeight={isDynamicHeightEnabled ? '100%' : height}
                canvasWidth={width}
                darkMode={darkMode}
                componentType="Container"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
