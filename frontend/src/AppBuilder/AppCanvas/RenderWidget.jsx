import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { OverlayTrigger } from 'react-bootstrap';
import { renderTooltip } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@/_ui/ErrorBoundary';

const shouldAddBoxShadowAndVisibility = [
  'Table',
  'TextInput',
  'TextArea',
  'PasswordInput',
  'EmailInput',
  'NumberInput',
  'Text',
  'Checkbox',
  'Button',
  'ToggleSwitchV2',
  'DropdownV2',
  'MultiselectV2',
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
}) => {
  const componentDefinition = useStore((state) => state.getComponentDefinition(id), shallow);
  const getDefaultStyles = useStore((state) => state.debugger.getDefaultStyles, shallow);
  const component = componentDefinition?.component;
  const componentName = component?.name;
  const [key, setKey] = useState(Math.random());
  const resolvedProperties = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex)?.properties,
    shallow
  );
  const resolvedStyles = useStore((state) => state.getResolvedComponent(id, subContainerIndex)?.styles, shallow);
  const fireEvent = useStore((state) => state.eventsSlice.fireEvent, shallow);
  const resolvedGeneralProperties = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex)?.general,
    shallow
  );
  const resolvedGeneralStyles = useStore(
    (state) => state.getResolvedComponent(id, subContainerIndex)?.generalStyles,
    shallow
  );
  const unResolvedValidation = componentDefinition?.component?.definition?.validation || {};
  // const others = useStore((state) => state.getResolvedComponent(id, subContainerIndex)?.others, shallow);
  const updateDependencyValues = useStore((state) => state.updateDependencyValues, shallow);
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const setExposedValue = useStore((state) => state.setExposedValue, shallow);
  const setExposedValues = useStore((state) => state.setExposedValues, shallow);
  const setDefaultExposedValues = useStore((state) => state.setDefaultExposedValues, shallow);
  const resolvedValidation = useStore((state) => state.getResolvedComponent(id)?.validation, shallow);
  const parentId = component?.parent;
  const customResolvables = useStore(
    (state) => state.resolvedStore.modules.canvas?.customResolvables?.[parentId],
    shallow
  );
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
        customResolveObjects: customResolvables,
        componentType,
      }),
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
        setExposedValue(id, key, value);
        // Trigger an update when the child components is directly linked to any component
        updateDependencyValues(`components.${id}.${key}`);
      } else {
        onOptionChange(key, value, id, subContainerIndex);
      }
    },
    [id, setExposedValue, updateDependencyValues, subContainerIndex, onOptionChange]
  );
  const setExposedVariables = useCallback(
    (exposedValues) => {
      if (onOptionsChange === null) {
        setExposedValues(id, 'components', exposedValues);
      } else {
        onOptionsChange(exposedValues, id, subContainerIndex);
      }
    },
    [id, setExposedValues, onOptionsChange]
  );
  const fireEventWrapper = useCallback(
    (eventName, options) => {
      fireEvent(eventName, id, 'canvas', customResolvables?.[subContainerIndex] ?? {}, options);
      return Promise.resolve();
    },
    [fireEvent, id, customResolvables, subContainerIndex]
  );

  const onComponentClick = useStore((state) => state.eventsSlice.onComponentClickEvent);
  setDefaultExposedValues(id, parentId, componentType);
  useEffect(() => {
    setExposedVariable('id', id);
  }, []);
  if (!componentDefinition?.component) return null;

  return (
    <ErrorBoundary>
      <OverlayTrigger
        placement={inCanvas ? 'auto' : 'top'}
        delay={{ show: 500, hide: 0 }}
        trigger={
          inCanvas && shouldAddBoxShadowAndVisibility.includes(component?.component)
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
                  shouldAddBoxShadowAndVisibility.includes(component?.component)
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
            padding: resolvedStyles?.padding == 'none' ? '0px' : '2px', //chart and image has a padding property other than container padding
          }}
          role={'Box'}
          className={inCanvas ? `_tooljet-${component?.component} _tooljet-${component?.name}` : ''} //required for custom CSS
        >
          <ComponentToRender
            id={id}
            key={key}
            {...obj}
            setExposedVariable={setExposedVariable}
            setExposedVariables={setExposedVariables}
            height={widgetHeight - 4}
            width={widgetWidth}
            fireEvent={fireEventWrapper}
            validate={validate}
            resetComponent={resetComponent}
            onComponentClick={onComponentClick}
            darkMode={darkMode}
            componentName={componentName}
          />
        </div>
      </OverlayTrigger>
    </ErrorBoundary>
  );
};
export default memo(RenderWidget);
