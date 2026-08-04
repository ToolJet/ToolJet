import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TrackedSuspense } from './SuspenseTracker';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { OverlayTrigger } from 'react-bootstrap';
import { renderTooltip } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import { BOX_PADDING } from './appCanvasConstants';
import WidgetTooltip from './WidgetTooltip';
import { normalizeLayoutContext } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';

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
];

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
  const component = useStore((state) => state.getComponentDefinition(id, moduleId)?.component, shallow);
  const getDefaultStyles = useStore((state) => state.debugger.getDefaultStyles, shallow);
  const componentCount = useStore((state) => state.getContainerChildrenMapping(id)?.length || 0, shallow);
  const getExposedPropertyForAdditionalActions = useStore(
    (state) => state.getExposedPropertyForAdditionalActions,
    shallow
  );
  const componentName = component?.name;
  const [key, setKey] = useState(Math.random());
  const resolvedProperties = useStore(
    (state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.properties,
    shallow
  );

  const resolvedStyles = useStore((state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.styles, shallow);
  // Per-widget custom CSS class is gated by the `customStyling` enterprise license flag.
  // When the license is absent we skip applying the class to the DOM, but the saved value
  // stays in the schema/DB so it re-applies if the license is re-enabled.
  const hasCustomStyling = useStore((state) => state.license.featureAccess?.customStyling);
  const fireEvent = useStore((state) => state.eventsSlice.fireEvent, shallow);
  const resolvedGeneralProperties = useStore(
    (state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.general,
    shallow
  );
  const resolvedGeneralStyles = useStore(
    (state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.generalStyles,
    shallow
  );
  const unResolvedValidation = component?.definition?.validation || {};
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const setExposedValue = useStore((state) => state.setExposedValue, shallow);
  const setExposedValues = useStore((state) => state.setExposedValues, shallow);
  const setExposedValuePerRow = useStore((state) => state.setExposedValuePerRow, shallow);
  const setExposedValuesPerRow = useStore((state) => state.setExposedValuesPerRow, shallow);
  const setDefaultExposedValues = useStore((state) => state.setDefaultExposedValues, shallow);
  const resolvedValidation = useStore(
    (state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.validation,
    shallow
  );
  const parentId = component?.parent;

  // Compute outer indices for this component's parent's custom resolvables
  // resolveIndex = [outerIdx, middleIdx, innerIdx] → parentOuterIndices = [outerIdx, middleIdx]
  // The last index is the immediate parent's row index (subContainerIndex)
  const parentOuterIndices = useMemo(() => {
    if (!resolveIndex) return [];
    const indices = Array.isArray(resolveIndex) ? resolveIndex : [resolveIndex];
    if (indices.length <= 1) return [];
    return indices.slice(0, -1);
  }, [resolveIndex]);

  const customResolvables = useStore((state) => {
    const lookupId = nearestListviewId || parentId;
    let base = state.resolvedStore.modules[moduleId]?.customResolvables?.[lookupId];
    if (!base) return base;
    // Navigate through outer indices to reach the correct nested level
    for (let i = 0; i < parentOuterIndices.length; i++) {
      base = base?.[parentOuterIndices[i]];
      if (!base) return undefined;
    }
    return base;
  }, shallow);
  const { t } = useTranslation();
  const transformedStyles = getDefaultStyles(resolvedStyles, componentType);

  const isDisabled = useStore((state) => {
    const component = state.getResolvedComponent(id, resolveIndex, moduleId);
    const componentExposedDisabled = getExposedPropertyForAdditionalActions(id, resolveIndex, 'isDisabled', moduleId);
    if (componentExposedDisabled !== undefined) return componentExposedDisabled;
    return component?.properties?.disabledState || component?.styles?.disabledState;
  });

  const isLoading = useStore((state) => {
    const component = state.getResolvedComponent(id, resolveIndex, moduleId);
    const componentExposedLoading = getExposedPropertyForAdditionalActions(id, resolveIndex, 'isLoading', moduleId);
    if (componentExposedLoading !== undefined) return componentExposedLoading;
    return component?.properties?.loadingState || component?.styles?.loadingState;
  });

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

  const ComponentToRender = useMemo(() => getComponentToRender(componentType), [componentType]);
  const setExposedVariable = useCallback(
    (key, value) => {
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
      fireEvent(eventName, id, moduleId, customResolvables?.[effectiveSubContainerIndex] ?? {}, options);
      return Promise.resolve();
    },
    [fireEvent, id, customResolvables, effectiveSubContainerIndex, moduleId]
  );

  const onComponentClick = useStore((state) => state.eventsSlice.onComponentClickEvent);
  setDefaultExposedValues(id, parentId, componentType);
  useEffect(() => {
    setExposedVariable('id', id);
  }, []);

  const collapseWhenHidden = resolvedProperties?.collapseWhenHidden ?? false;
  const resolvedWidgetVisibility = useStore((state) => {
    const resolved = state.getResolvedComponent(id, resolveIndex, moduleId);
    const exposed = getExposedPropertyForAdditionalActions(id, resolveIndex, 'isVisible', moduleId);
    if (exposed !== undefined) return exposed;
    return resolved?.properties?.visibility ?? resolved?.styles?.visibility ?? true;
  }, shallow);
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
  const hasUserTooltip = !!userTooltipContent?.toString().trim();

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
          onComponentClick={onComponentClick}
          darkMode={darkMode}
          componentName={componentName}
          componentCount={componentCount}
          dataCy={`${componentName}`}
          currentMode={currentMode}
          subContainerIndex={subContainerIndex}
          componentType={componentType}
        />
      </TrackedSuspense>
    </div>
  );

  // On-canvas tooltip uses the new rich-content WidgetTooltip (plainText / markdown / html).
  // The off-canvas case (component-picker preview) keeps using OverlayTrigger because that
  // tooltip surfaces the widget's *description*, not user-authored content.
  if (inCanvas) {
    return (
      <ErrorBoundary>
        <WidgetTooltip
          content={userTooltipContent}
          format={userTooltipFormat}
          show={hasUserTooltip}
          darkMode={darkMode}
        >
          {innerWidget}
        </WidgetTooltip>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

RenderWidget.displayName = 'RenderWidget';

export default memo(RenderWidget);
