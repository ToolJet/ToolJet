import React, { useEffect, useMemo, useRef } from 'react';
import { Container as ContainerComponent } from '@/AppBuilder/AppCanvas/Container';
import Spinner from '@/_ui/Spinner';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import {
  CONTAINER_FORM_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import './accordion.scss';
import Header from './components/Header';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/mediaC';

export const Accordion = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
  currentLayout,
  componentCount = 0,
  currentMode,
  subContainerIndex,
  fireEvent,
  componentType,
  moduleId,
  resolveIndex,
}) => {
  const { headerHeight = 80, showHeader, dynamicHeight, loadingState, visibility, disabledState } = properties;
  const { borderRadius, borderColor, boxShadow, headerDividerColor, chevronIconColor } = styles;

  // Controlled: the store is the source of truth for exposed state; resolved
  // properties are the pre-first-publish fallbacks.
  const exposedOpts = { resolveIndex, moduleId };
  const isExpanded = useExposedVariable(id, 'isExpanded', exposedOpts, true);
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);

  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  const accordionRef = useRef(null);
  // Disabled accordion blocks the mouse via `data-disabled`; `inert` also removes the child
  // components from the tab order (runtime only — keeps the builder editable).
  useDisableInert(accordionRef, isDisabled);

  const updateGrid = useStore((state) => state.incrementCanvasUpdater, shallow);

  // Dynamic height - always enable position adjustments in view mode for accordion
  const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
  const shouldAdjustPositions = currentMode === 'view';
  useDynamicHeight({
    isDynamicHeightEnabled: shouldAdjustPositions,
    id,
    height,
    currentLayout,
    isContainer: true,
    componentCount,
    value: JSON.stringify({ headerHeight, showHeader, isExpanded }),
    visibility: isVisible,
    subContainerIndex,
    componentType,
  });

  // Toggle helper: expand/collapse are contract reducers; the events the old
  // closures fired travel in the same dispatch (one command batch).
  const toggleExpanded = (expand) => {
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: expand ? 'expand' : 'collapse', args: [] },
      { kind: 'FIRE_EVENT', componentId: id, event: expand ? 'onExpand' : 'onCollapse' },
    ]);
  };

  // Mount: initial exposed snapshot + contract-generated CSA shims. The
  // expand/collapse shims are overridden to include the events.
  useEffect(() => {
    setExposedVariables({
      isVisible: visibility,
      isDisabled: disabledState,
      isLoading: loadingState,
      isExpanded: true, // State for expanding/collapsing accordion component
      ...csaShims(),
      expand: async () => toggleExpanded(true),
      collapse: async () => toggleExpanded(false),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Property-sync write-throughs (store-read state renders them).
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  // Update grid inside Editor whenever accordion opens
  useEffect(() => {
    if (currentMode === 'edit' && isExpanded) {
      updateGrid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, isExpanded]);

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
    ...(isDynamicHeightEnabled && isExpanded && { minHeight: `${height}px` }),
    height: !isExpanded
      ? headerHeight + CONTAINER_FORM_CANVAS_PADDING + 3 + 2 // 3 for bottom padding and 2 for top-bottom border
      : isDynamicHeightEnabled
      ? '100%'
      : height,
    display: isVisible && (showHeader || isExpanded) ? 'flex' : 'none',
    flexDirection: 'column',
    position: 'relative',
    boxShadow,
    '--cc-accordion-header-divider-color': headerDividerColor,
  };

  const accordionContentStyles = useMemo(() => {
    return {
      display: isExpanded ? 'flex' : 'none',
      height: '100%',
      padding: `${CONTAINER_FORM_CANVAS_PADDING}px`,
      ...(isDisabled && {
        opacity: 0.5,
        pointerEvents: 'none',
      }),
    };
  }, [isDisabled, isExpanded]);

  return (
    <div
      ref={accordionRef}
      className={`jet-container ${isLoading ? 'jet-container-loading' : ''} ${
        isExpanded ? 'jet-accordion-expanded' : 'jet-accordion-collapsed'
      }`}
      id={id}
      data-disabled={isDisabled}
      style={computedStyles}
    >
      {isLoading ? (
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
              isExpanded={isExpanded}
              // Header fires onExpand/onCollapse itself — dispatch only the CSA here.
              setExpanded={(expand) =>
                dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: expand ? 'expand' : 'collapse', args: [] }])
              }
              fireEvent={fireEvent}
              isDisabled={isDisabled}
              chevronIconColor={chevronIconColor}
            />
          )}
          <div
            style={accordionContentStyles}
            className={`${dynamicHeight && `dynamic-${id}`} widget-type-container`}
            data-disabled={isDisabled}
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
        </>
      )}
    </div>
  );
};
