import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { OverlayTrigger } from 'react-bootstrap';
import { renderTooltip } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import { BOX_PADDING } from './appCanvasConstants';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';

const SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY = [
  'Table',
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
  'Tabs',
  'RangeSliderV2',
  'Statistics',
  'StarRating',
  'PopoverMenu',
  'Tags',
  'CircularProgressBar',
  'Kanban',
  'AudioRecorder',
  'Camera',
];

const RenderWidget = ({
  id,
  widgetHeight,
  componentType,
  subContainerIndex,
  onOptionChange,
  onOptionsChange,
  widgetWidth,
  inCanvas = false,
  darkMode,
  moduleId,
  currentMode,
}) => {
  const { contextPath } = useSubcontainerContext();
  const indices = useMemo(() => {
    const result = contextPath.map((s) => s.index);
    return result.length > 0 ? result : null;
  }, [contextPath]);
  // Use full indices array for resolved component lookups
  const resolveIndex = indices ?? subContainerIndex;

  const component = useStore((state) => state.getComponentDefinition(id, moduleId)?.component, shallow);
  const getDefaultStyles = useStore((state) => state.debugger.getDefaultStyles, shallow);
  const adjustComponentPositions = useStore((state) => state.adjustComponentPositions, shallow);
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
  // const others = useStore((state) => state.getResolvedComponent(id, subContainerIndex)?.others, shallow);
  const updateDependencyValues = useStore((state) => state.updateDependencyValues, shallow);
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const setExposedValue = useStore((state) => state.setExposedValue, shallow);
  const setExposedValues = useStore((state) => state.setExposedValues, shallow);
  const setDefaultExposedValues = useStore((state) => state.setDefaultExposedValues, shallow);
  const resolvedValidation = useStore(
    (state) => state.getResolvedComponent(id, resolveIndex, moduleId)?.validation,
    shallow
  );
  const parentId = component?.parent;
  // Compute outer indices for this component's parent's custom resolvables
  // If contextPath is [{ containerId: 'outerLV', index: 2 }, { containerId: 'innerLV', index: 1 }]
  // and parentId is 'innerLV', then outerIndices for parent = [2] (indices before the parent segment)
  const parentOuterIndices = useMemo(() => {
    if (!parentId || contextPath.length === 0) return [];
    const parentSegmentIdx = contextPath.findIndex((s) => s.containerId === parentId);
    if (parentSegmentIdx <= 0) return [];
    return contextPath.slice(0, parentSegmentIdx).map((s) => s.index);
  }, [parentId, contextPath]);

  const customResolvables = useStore((state) => {
    let base = state.resolvedStore.modules[moduleId]?.customResolvables?.[parentId];
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
    const componentExposedDisabled = getExposedPropertyForAdditionalActions(
      id,
      subContainerIndex,
      'isDisabled',
      moduleId
    );
    if (componentExposedDisabled !== undefined) return componentExposedDisabled;
    return component?.properties?.disabledState || component?.styles?.disabledState;
  });

  const isLoading = useStore((state) => {
    const component = state.getResolvedComponent(id, resolveIndex, moduleId);
    const componentExposedLoading = getExposedPropertyForAdditionalActions(
      id,
      subContainerIndex,
      'isLoading',
      moduleId
    );
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
        customResolveObjects: customResolvables?.[subContainerIndex] ?? {},
        componentType,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateWidget, customResolvables, subContainerIndex, unResolvedValidation, resolvedValidation, moduleId]
  );

  const resetComponent = useCallback(() => {
    setKey(Math.random());
  }, []);

  const ComponentToRender = useMemo(() => getComponentToRender(componentType), [componentType]);
  const setExposedVariable = useCallback(
    (key, value) => {
      setExposedValue(id, key, value, moduleId);
      // Trigger an update when the child components is directly linked to any component
      updateDependencyValues(`components.${id}.${key}`, moduleId);

      // Check if the component is inside the subcontainer and it has its own onOptionChange(setExposedValue) function
      if (onOptionChange !== null) {
        onOptionChange(key, value, id, subContainerIndex);
      }
    },
    [id, setExposedValue, updateDependencyValues, subContainerIndex, onOptionChange, moduleId]
  );
  const setExposedVariables = useCallback(
    (exposedValues) => {
      setExposedValues(id, 'components', exposedValues, moduleId);

      if (onOptionsChange !== null) {
        onOptionsChange(exposedValues, id, subContainerIndex);
      }
    },
    [id, setExposedValues, onOptionsChange, moduleId]
  );
  const fireEventWrapper = useCallback(
    (eventName, options) => {
      fireEvent(eventName, id, moduleId, customResolvables?.[subContainerIndex] ?? {}, options);
      return Promise.resolve();
    },
    [fireEvent, id, customResolvables, subContainerIndex, moduleId]
  );

  const onComponentClick = useStore((state) => state.eventsSlice.onComponentClickEvent);
  setDefaultExposedValues(id, parentId, componentType);
  useEffect(() => {
    setExposedVariable('id', id);
  }, []);
  if (!component) return null;

  return (
    <ErrorBoundary>
      <OverlayTrigger
        placement={inCanvas ? 'auto' : 'top'}
        delay={{ show: 500, hide: 0 }}
        trigger={
          inCanvas && SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY.includes(component?.component)
            ? !resolvedProperties?.tooltip?.toString().trim()
              ? null
              : ['hover', 'focus']
            : !resolvedGeneralProperties?.tooltip?.toString().trim()
            ? null
            : ['hover', 'focus']
        }
        overlay={(props) =>
          renderTooltip({
            props,
            text: inCanvas
              ? `${
                  SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY.includes(component?.component)
                    ? resolvedProperties?.tooltip
                    : resolvedGeneralProperties?.tooltip
                }`
              : `${t(`widget.${component?.name}.description`, component?.description)}`,
          })
        }
      >
        <div
          style={{
            height: '100%',
            padding: resolvedStyles?.padding == 'none' ? '0px' : `${BOX_PADDING}px`, //chart and image has a padding property other than container padding
          }}
          className={`canvas-component ${
            inCanvas ? `_tooljet-${component?.component} _tooljet-${component?.name}` : ''
          } ${
            !['Modal', 'ModalV2', 'CircularProgressBar'].includes(component.component) && (isDisabled || isLoading)
              ? 'disabled'
              : ''
          }`} //required for custom CSS
        >
          <ComponentToRender
            id={id}
            key={key}
            {...obj}
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
            adjustComponentPositions={adjustComponentPositions}
            componentCount={componentCount}
            dataCy={`draggable-widget-${componentName}`}
            currentMode={currentMode}
            subContainerIndex={subContainerIndex}
          />
        </div>
      </OverlayTrigger>
    </ErrorBoundary>
  );
};

RenderWidget.displayName = 'RenderWidget';

export default memo(RenderWidget);
