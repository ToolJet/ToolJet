import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TrackedSuspense } from './SuspenseTracker';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { OverlayTrigger } from 'react-bootstrap';
import { renderTooltip } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import FallbackBoundary from '@/_ui/ErrorBoundary/FallbackBoundary';
import { BOX_PADDING } from './appCanvasConstants';
import WidgetTooltip from './WidgetTooltip';
import { normalizeLayoutContext } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { useWidgetStore, widgetInputs } from '@/AppBuilder/_engines/rendering/useWidgetStore';

const SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY = [
  'Table',
  'Pagination',
  'TextInput',
  'TextArea',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'NumberInput',
  'Text',
  'Checkbox',
  'Button',
  'ToggleSwitchV2',
  'DropdownV2',
  'MultiselectV2',
  'RadioButtonV2',
  'Icon',
  'Image',
  'DatetimePickerV2',
  'DaterangePicker',
  'DatePickerV2',
  'TimePicker',
  'Divider',
  'VerticalDivider',
  'Link',
  'Form',
  'FilePicker',
  'FileInput',
  'Tabs',
  'RangeSliderV2',
  'Statistics',
  'StarRating',
  'PopoverMenu',
  'Tags',
  'CircularProgressBar',
  'Kanban',
  'ProgressBar',
  'AudioRecorder',
  'Camera',
  'JSONExplorer',
  'JSONEditor',
  'IFrame',
  'Accordion',
  'ReorderableList',
  'KeyValuePair',
  'ColorPicker',
  'FileButton',
  'ButtonGroupV2',
  'Listview',
  'FlexContainer',
  'TagsInput',
  'TreeSelect',
  'Cascader',
  'ModalV2',
  'Container',
  'Timeline',
];

const WIDGETS_WITH_PORTALED_CONTENT = ['ModalV2'];

const RenderWidget = ({
  id,
  widgetHeight,
  componentType,
  subContainerIndex,
  resolveIndex,
  nearestListviewId,
  effectiveSubContainerIndex,
  onOptionChange,
  onOptionsChange,
  widgetWidth,
  inCanvas = false,
  darkMode,
  moduleId,
  currentMode,
  currentLayout,
}) => {
  // Store actions are created once and never change: read, not subscribed to (a subscription per action per widget
  // added a store listener each, run on every store write).
  const {
    debugger: { getDefaultStyles },
    eventsSlice: { fireEvent, onComponentClickEvent: onComponentClick },
    validateWidget,
    setExposedValue,
    setExposedValues,
    setExposedValuePerRow,
    setExposedValuesPerRow,
    setDefaultExposedValues,
    resetComponentExposedValues,
    resetComponentExposedValuesPerRow,
  } = useStore.getState();
  // Compute outer indices for this component's parent's custom resolvables
  // resolveIndex = [outerIdx, middleIdx, innerIdx] → parentOuterIndices = [outerIdx, middleIdx]
  // The last index is the immediate parent's row index (subContainerIndex)
  const parentOuterIndices = useMemo(() => {
    if (!resolveIndex) return [];
    const indices = Array.isArray(resolveIndex) ? resolveIndex : [resolveIndex];
    if (indices.length <= 1) return [];
    return indices.slice(0, -1);
  }, [resolveIndex]);

  // One store subscription for the widget's values (see useWidgetStore), each compared as before.
  const resolved = (state) => state.getResolvedComponent(id, resolveIndex, moduleId);
  const {
    component,
    componentCount,
    resolvedProperties,
    resolvedStyles,
    hasCustomStyling,
    resolvedGeneralProperties,
    resolvedGeneralStyles,
    resolvedValidation,
    customResolvables,
    isDisabled,
    isLoading,
    resolvedWidgetVisibility,
  } = useWidgetStore(
    useStore,
    (state) => [...widgetInputs(state, id, moduleId, nearestListviewId), state.license],
    [id, resolveIndex, moduleId, nearestListviewId, parentOuterIndices],
    {
      component: [(state) => state.getComponentDefinition(id, moduleId)?.component, shallow],
      componentCount: [(state) => state.getContainerChildrenMapping(id)?.length || 0, shallow],
      resolvedProperties: [(state) => resolved(state)?.properties, shallow],
      resolvedStyles: [(state) => resolved(state)?.styles, shallow],
      // Per-widget custom CSS class is gated by the `customStyling` enterprise license flag.
      // When the license is absent we skip applying the class to the DOM, but the saved value
      // stays in the schema/DB so it re-applies if the license is re-enabled.
      hasCustomStyling: [(state) => state.license.featureAccess?.customStyling],
      resolvedGeneralProperties: [(state) => resolved(state)?.general, shallow],
      resolvedGeneralStyles: [(state) => resolved(state)?.generalStyles, shallow],
      resolvedValidation: [(state) => resolved(state)?.validation, shallow],
      customResolvables: [
        (state) => {
          const lookupId = nearestListviewId || state.getComponentDefinition(id, moduleId)?.component?.parent;
          let base = state.resolvedStore.modules[moduleId]?.customResolvables?.[lookupId];
          if (!base) return base;
          // Navigate through outer indices to reach the correct nested level
          for (let i = 0; i < parentOuterIndices.length; i++) {
            base = base?.[parentOuterIndices[i]];
            if (!base) return undefined;
          }
          return base;
        },
        shallow,
      ],
      isDisabled: [
        (state) => {
          const exposed = state.getExposedPropertyForAdditionalActions(id, resolveIndex, 'isDisabled', moduleId);
          if (exposed !== undefined) return exposed;
          return resolved(state)?.properties?.disabledState || resolved(state)?.styles?.disabledState;
        },
      ],
      isLoading: [
        (state) => {
          const exposed = state.getExposedPropertyForAdditionalActions(id, resolveIndex, 'isLoading', moduleId);
          if (exposed !== undefined) return exposed;
          return resolved(state)?.properties?.loadingState || resolved(state)?.styles?.loadingState;
        },
      ],
      resolvedWidgetVisibility: [
        (state) => {
          const exposed = state.getExposedPropertyForAdditionalActions(id, resolveIndex, 'isVisible', moduleId);
          if (exposed !== undefined) return exposed;
          const component = resolved(state);
          return component?.properties?.visibility ?? component?.styles?.visibility ?? true;
        },
        shallow,
      ],
    }
  );
  const componentName = component?.name;
  const [key, setKey] = useState(Math.random());
  const unResolvedValidation = component?.definition?.validation || {};
  const parentId = component?.parent;
  const { t } = useTranslation();
  const transformedStyles = getDefaultStyles(resolvedStyles, componentType);

  const obj = {
    properties: { ...resolvedGeneralProperties, ...resolvedProperties },
    styles: { ...resolvedGeneralStyles, ...transformedStyles },
    validation: resolvedValidation,
    ...(componentType === 'CustomComponent' && { component }),
  };

  const validate = useCallback(
    (value) =>
      validateWidget({
        ...{ widgetValue: value },
        ...{ validationObject: unResolvedValidation },
        customResolveObjects: customResolvables?.[effectiveSubContainerIndex] ?? {},
        componentType,
        nearestListviewId,
        rowIndex: effectiveSubContainerIndex,
        moduleId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      validateWidget,
      customResolvables,
      effectiveSubContainerIndex,
      unResolvedValidation,
      resolvedValidation,
      moduleId,
      nearestListviewId,
      componentType,
    ]
  );

  const resetComponent = useCallback(() => {
    setKey(Math.random());
  }, []);

  const resetExposedVariables = useCallback(() => {
    if (nearestListviewId && resolveIndex) {
      // Inside a ListView — per-row reset (flat reset would clear every row's array slot)
      const indices = Array.isArray(resolveIndex) ? resolveIndex : [resolveIndex];
      resetComponentExposedValuesPerRow(id, indices, moduleId);
    } else {
      resetComponentExposedValues(id, moduleId);
    }
  }, [id, moduleId, resetComponentExposedValues, resetComponentExposedValuesPerRow, nearestListviewId, resolveIndex]);

  const ComponentToRender = useMemo(() => getComponentToRender(componentType), [componentType]);
  // A row's widget that has unmounted (its row scrolled out of a long ListView, or another page shown) writes nothing:
  // its row slot may hold another row by then. Its exposed functions (setText…) can outlive it in the ListView's
  // children.
  const unmounted = useRef(false);
  useEffect(() => {
    unmounted.current = false; // mounted again (StrictMode remounts effects)
    return () => {
      unmounted.current = true;
    };
  }, []);
  const setExposedVariable = useCallback(
    (key, value) => {
      if (nearestListviewId && unmounted.current) return;
      if (nearestListviewId && resolveIndex) {
        // Inside a ListView — per-row store write
        const indices = Array.isArray(resolveIndex) ? resolveIndex : [resolveIndex];

        setExposedValuePerRow(id, key, value, indices, moduleId);
        // updateDependencyValues called internally — no duplicate call
      } else {
        // Not inside a ListView — flat store write (existing path)
        setExposedValue(id, key, value, moduleId);
        // setExposedValue calls updateDependencyValues internally — no duplicate call
      }
      // ALWAYS call onOptionChange if provided (for any subcontainer that still uses it)
      if (onOptionChange !== null) {
        onOptionChange(key, value, id, subContainerIndex);
      }
    },
    [
      id,
      setExposedValue,
      setExposedValuePerRow,
      subContainerIndex,
      onOptionChange,
      moduleId,
      nearestListviewId,
      resolveIndex,
    ]
  );
  const setExposedVariables = useCallback(
    (exposedValues) => {
      if (nearestListviewId && unmounted.current) return;
      if (nearestListviewId && resolveIndex) {
        // Inside a ListView — per-row store write
        const indices = Array.isArray(resolveIndex) ? resolveIndex : [resolveIndex];
        setExposedValuesPerRow(id, exposedValues, indices, moduleId);
      } else {
        // Not inside a ListView — flat store write (existing path)
        setExposedValues(id, 'components', exposedValues, moduleId);
      }
      if (onOptionsChange !== null) {
        onOptionsChange(exposedValues, id, subContainerIndex);
      }
    },
    [
      id,
      setExposedValues,
      setExposedValuesPerRow,
      onOptionsChange,
      moduleId,
      subContainerIndex,
      nearestListviewId,
      resolveIndex,
    ]
  );
  const fireEventWrapper = useCallback(
    (eventName, options) => {
      fireEvent(
        eventName,
        id,
        moduleId,
        customResolvables?.[effectiveSubContainerIndex] ?? {},
        options,
        resolveIndex ?? null
      );
      return Promise.resolve();
    },
    [fireEvent, id, customResolvables, effectiveSubContainerIndex, moduleId, resolveIndex]
  );

  setDefaultExposedValues(id, parentId, componentType, moduleId);
  useEffect(() => {
    setExposedVariable('id', id);
  }, []);

  const collapseWhenHidden = resolvedProperties?.collapseWhenHidden ?? false;
  useEffect(() => {
    if (currentMode !== 'view') return;
    if (!collapseWhenHidden) return;
    const contextIndices = normalizeLayoutContext(resolveIndex);
    const handle = requestAnimationFrame(() => {
      useStore.getState().scheduleReflow(id, currentLayout, false, contextIndices, moduleId);
    });
    return () => cancelAnimationFrame(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedWidgetVisibility, collapseWhenHidden, currentMode]);

  if (!component) return null;

  // Pick the tooltip source — some widgets keep tooltip under `properties`,
  // others under `general`. SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY enumerates
  // the former group.
  const isShadowedWidget = SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY.includes(component?.component);
  const userTooltipContent = isShadowedWidget ? resolvedProperties?.tooltip : resolvedGeneralProperties?.tooltip;
  const userTooltipFormat = isShadowedWidget
    ? resolvedProperties?.tooltipFormat
    : resolvedGeneralProperties?.tooltipFormat;
  const hasUserTooltip = !!String(userTooltipContent ?? '').trim();
  const selfScopesTooltip = WIDGETS_WITH_PORTALED_CONTENT.includes(component?.component);

  // User-defined CSS class(es), gated by the customStyling license. Trimmed + whitespace-collapsed.
  const userCssClass = hasCustomStyling ? (resolvedStyles?.cssClass ?? '').trim().replace(/\s+/g, ' ') : '';
  const isDisabledOrLoading =
    !['Modal', 'ModalV2', 'CircularProgressBar'].includes(component.component) && (isDisabled || isLoading);
  const innerWidgetClassName = [
    'canvas-component',
    inCanvas && `_tooljet-${component?.component} _tooljet-${component?.name}`,
    isDisabledOrLoading && 'disabled',
    userCssClass,
  ]
    .filter(Boolean)
    .join(' ');

  const innerWidget = (
    <div
      style={{
        height: '100%',
        padding: resolvedStyles?.padding == 'none' ? '0px' : `${BOX_PADDING}px`, //chart and image has a padding property other than container padding
      }}
      className={innerWidgetClassName}
      data-cy={`draggable-widget-${componentName}`}
    >
      <TrackedSuspense fallback={null}>
        <ComponentToRender
          id={id}
          key={key}
          {...obj}
          currentLayout={currentLayout}
          setExposedVariable={setExposedVariable}
          setExposedVariables={setExposedVariables}
          height={widgetHeight - 4}
          width={widgetWidth}
          parentId={parentId}
          fireEvent={fireEventWrapper}
          validate={validate}
          resetComponent={resetComponent}
          resetExposedVariables={resetExposedVariables}
          onComponentClick={onComponentClick}
          darkMode={darkMode}
          componentName={componentName}
          componentCount={componentCount}
          dataCy={`${componentName}`}
          currentMode={currentMode}
          subContainerIndex={subContainerIndex}
          componentType={componentType}
          {...(selfScopesTooltip && {
            tooltipProps: { content: userTooltipContent, format: userTooltipFormat, show: hasUserTooltip },
          })}
        />
      </TrackedSuspense>
    </div>
  );

  // On-canvas tooltip uses the new rich-content WidgetTooltip (plainText / markdown / html).
  // The off-canvas case (component-picker preview) keeps using OverlayTrigger because that
  // tooltip surfaces the widget's *description*, not user-authored content.
  if (inCanvas) {
    return (
      <FallbackBoundary
        variant="inline"
        label={componentName}
        location={`Component ${componentName}`}
        canRetry
        canReport={currentMode === 'edit'}
        darkMode={darkMode}
        resetKeys={[id]}
        widgetType={componentType}
      >
        {selfScopesTooltip ? (
          innerWidget
        ) : (
          <WidgetTooltip
            content={userTooltipContent}
            format={userTooltipFormat}
            show={hasUserTooltip}
            darkMode={darkMode}
          >
            {innerWidget}
          </WidgetTooltip>
        )}
      </FallbackBoundary>
    );
  }

  return (
    <FallbackBoundary
      variant="inline"
      label={componentName}
      location={`Component ${componentName}`}
      canRetry
      canReport={currentMode === 'edit'}
      darkMode={darkMode}
      resetKeys={[id]}
      widgetType={componentType}
    >
      <OverlayTrigger
        placement="top"
        delay={{ show: 500, hide: 0 }}
        overlay={(props) =>
          renderTooltip({
            props: { ...props, style: { ...props.style, whiteSpace: 'pre-wrap' } },
            text: `${t(`widget.${component?.name}.description`, component?.description)}`,
          })
        }
      >
        {innerWidget}
      </OverlayTrigger>
    </FallbackBoundary>
  );
};

RenderWidget.displayName = 'RenderWidget';

export default memo(RenderWidget);
