import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { OverlayTrigger } from 'react-bootstrap';
import { renderTooltip } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import { BOX_PADDING } from './appCanvasConstants';

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
  'RangeSliderV2'
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
}) => {
  const component = useStore((state) => state.getComponentDefinition(id, moduleId)?.component, shallow);
  const getDefaultStyles = useStore((state) => state.debugger.getDefaultStyles, shallow);
  const adjustComponentPositions = useStore((state) => state.adjustComponentPositions, shallow);
  const componentCount = useStore((state) => state.getContainerChildrenMapping(id)?.length || 0, shallow);
  const componentName = component?.name;
  const [key, setKey] = useState(Math.random());
  const resolvedProperties = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex, moduleId)?.properties,
    shallow
  );
  const resolvedStyles = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex, moduleId)?.styles,
    shallow
  );
  const fireEvent = useStore((state) => state.eventsSlice.fireEvent, shallow);
  const resolvedGeneralProperties = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex, moduleId)?.general,
    shallow
  );
  const resolvedGeneralStyles = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex, moduleId)?.generalStyles,
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
    (state) => state.getResolvedComponent(id, subContainerIndex, moduleId)?.validation,
    shallow
  );
  const parentId = component?.parent;
  const customResolvables = useStore(
    (state) => state.resolvedStore.modules[moduleId]?.customResolvables?.[parentId],
    shallow
  );
  const { t } = useTranslation();
  const transformedStyles = getDefaultStyles(resolvedStyles, componentType);

  const isDisabled = useStore((state) => {
    const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
    const componentExposedDisabled = state.getExposedValueOfComponent(id, moduleId)?.isDisabled;
    if (typeof componentExposedDisabled === 'boolean') return componentExposedDisabled;
    if (component?.properties?.disabledState === true || component?.styles?.disabledState === true) return true;
    return false;
  });

  const isLoading = useStore((state) => {
    const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
    const componentExposedLoading = state.getExposedValueOfComponent(id, moduleId)?.isLoading;
    if (typeof componentExposedLoading === 'boolean') return componentExposedLoading;
    if (component?.properties?.loadingState === true || component?.styles?.loadingState === true) return true;
    return false;
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
        customResolveObjects: customResolvables,
        componentType,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validateWidget, customResolvables, unResolvedValidation, resolvedValidation]
  );

  const resetComponent = useCallback(() => {
    setKey(Math.random());
  }, []);

  const ComponentToRender = useMemo(() => getComponentToRender(componentType), [componentType]);
  const setExposedVariable = useCallback(
    (key, value) => {
      // Check if the component is inside the subcontainer and it has its own onOptionChange(setExposedValue) function
      if (onOptionChange === null) {
        setExposedValue(id, key, value, moduleId);
        // Trigger an update when the child components is directly linked to any component
        updateDependencyValues(`components.${id}.${key}`, moduleId);
      } else {
        onOptionChange(key, value, id, subContainerIndex);
      }
    },
    [id, setExposedValue, updateDependencyValues, subContainerIndex, onOptionChange, moduleId]
  );
  const setExposedVariables = useCallback(
    (exposedValues) => {
      if (onOptionsChange === null) {
        setExposedValues(id, 'components', exposedValues, moduleId);
      } else {
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
              ? `${SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY.includes(component?.component)
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
          role={'Box'}
          className={`canvas-component ${inCanvas ? `_tooljet-${component?.component} _tooljet-${component?.name}` : ''
            } ${!['Modal', 'ModalV2'].includes(component.component) && (isDisabled || isLoading) ? 'disabled' : ''}`} //required for custom CSS
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
          />
        </div>
      </OverlayTrigger>
    </ErrorBoundary>
  );
};

RenderWidget.displayName = 'RenderWidget';

export default memo(RenderWidget);
