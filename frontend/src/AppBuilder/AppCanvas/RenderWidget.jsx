import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { OverlayTrigger } from 'react-bootstrap';
import { renderTooltip } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/_ui/ErrorBoundary';
import { BOX_PADDING } from './appCanvasConstants';
import { resolveDynamicValues } from '@/AppBuilder/_stores/utils';

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
  parentSubContainerIndex = null,
}) => {
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
  const unResolvedProperties = component?.definition?.properties || {};
  const unResolvedStyles = component?.definition?.styles || {};
  // const others = useStore((state) => state.getResolvedComponent(id, subContainerIndex)?.others, shallow);
  const updateDependencyValues = useStore((state) => state.updateDependencyValues, shallow);
  const getAllExposedValues = useStore((state) => state.getAllExposedValues, shallow);
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
    (state) => {
      // For nested containers, use parentSubContainerIndex to get the correct customResolvables
      // This handles cases like Listview inside Listview
      const raw = state.resolvedStore.modules[moduleId]?.customResolvables?.[parentId];
      if (parentSubContainerIndex !== null && parentSubContainerIndex !== undefined && raw && !Array.isArray(raw)) {
        // Nested structure - get customResolvables for the specific parent row
        return raw[parentSubContainerIndex] || [];
      }
      return raw;
    },
    shallow
  );
  const { t } = useTranslation();
  const transformedStyles = getDefaultStyles(resolvedStyles, componentType);

  const isDisabled = useStore((state) => {
    const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
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
    const component = state.getResolvedComponent(id, subContainerIndex, moduleId);
    const componentExposedLoading = getExposedPropertyForAdditionalActions(
      id,
      subContainerIndex,
      'isLoading',
      moduleId
    );
    if (componentExposedLoading !== undefined) return componentExposedLoading;
    return component?.properties?.loadingState || component?.styles?.loadingState;
  });

  // Re-resolve properties at render time for components inside nested containers (e.g., Listview inside Listview)
  // This is necessary because the original resolution doesn't have access to parentSubContainerIndex
  const reResolvedProperties = useMemo(() => {
    // Only re-resolve if we're in a nested container context
    if (parentSubContainerIndex === null || parentSubContainerIndex === undefined) {
      return resolvedProperties;
    }

    // Check if we have customResolvables for this context
    if (!customResolvables || (Array.isArray(customResolvables) && customResolvables.length === 0)) {
      return resolvedProperties;
    }

    // Get the customResolvables item for the current subContainerIndex (row in the immediate parent)
    const currentCustomResolvables = Array.isArray(customResolvables)
      ? customResolvables[subContainerIndex] || {}
      : customResolvables;

    // Re-resolve properties that might reference listItem
    const reResolved = { ...resolvedProperties };
    const exposedValues = getAllExposedValues(moduleId);

    Object.keys(unResolvedProperties).forEach((propKey) => {
      const unResolvedValue = unResolvedProperties[propKey]?.value;
      if (typeof unResolvedValue === 'string' && unResolvedValue.includes('{{') && unResolvedValue.includes('listItem')) {
        try {
          const resolved = resolveDynamicValues(unResolvedValue, exposedValues, currentCustomResolvables, false, []);
          reResolved[propKey] = resolved;
        } catch (e) {
          // Keep original resolved value if re-resolution fails
        }
      }
    });

    return reResolved;
  }, [
    parentSubContainerIndex,
    subContainerIndex,
    customResolvables,
    resolvedProperties,
    unResolvedProperties,
    getAllExposedValues,
    moduleId,
  ]);

  // Similarly re-resolve styles if needed
  const reResolvedStyles = useMemo(() => {
    if (parentSubContainerIndex === null || parentSubContainerIndex === undefined) {
      return transformedStyles;
    }

    if (!customResolvables || (Array.isArray(customResolvables) && customResolvables.length === 0)) {
      return transformedStyles;
    }

    const currentCustomResolvables = Array.isArray(customResolvables)
      ? customResolvables[subContainerIndex] || {}
      : customResolvables;

    const reResolved = { ...transformedStyles };
    const exposedValues = getAllExposedValues(moduleId);

    Object.keys(unResolvedStyles).forEach((styleKey) => {
      const unResolvedValue = unResolvedStyles[styleKey]?.value;
      if (typeof unResolvedValue === 'string' && unResolvedValue.includes('{{') && unResolvedValue.includes('listItem')) {
        try {
          const resolved = resolveDynamicValues(unResolvedValue, exposedValues, currentCustomResolvables, false, []);
          reResolved[styleKey] = resolved;
        } catch (e) {
          // Keep original resolved value if re-resolution fails
        }
      }
    });

    return reResolved;
  }, [
    parentSubContainerIndex,
    subContainerIndex,
    customResolvables,
    transformedStyles,
    unResolvedStyles,
    getAllExposedValues,
    moduleId,
  ]);

  const obj = {
    properties: { ...resolvedGeneralProperties, ...reResolvedProperties },
    styles: { ...resolvedGeneralStyles, ...reResolvedStyles },
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
