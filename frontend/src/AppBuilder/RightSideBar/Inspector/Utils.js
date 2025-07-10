import React from 'react';
import { Code } from './Elements/Code';
import { QuerySelector } from './QuerySelector';
import { resolveReferences } from '@/_helpers/utils';

export function renderQuerySelector(component, dataQueries, eventOptionUpdated, eventName, eventMeta) {
  let definition = component.component.definition.events[eventName];
  definition = definition || {};

  return (
    <QuerySelector
      param={{ name: eventName }}
      definition={definition}
      eventMeta={eventMeta}
      dataQueries={dataQueries}
      eventOptionUpdated={eventOptionUpdated}
    />
  );
}
export function renderCustomStyles(
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  param,
  paramType,
  currentState,
  components = {},
  accordian,
  darkMode = false,
  placeholder = '',
  customMeta
) {
  const componentConfig = component.component;
  const componentDefinition = componentConfig.definition;
  const paramTypeDefinition = componentDefinition[paramType] || {};
  const definition = paramTypeDefinition[param] || {};
  const meta = customMeta ?? componentMeta[paramType]?.[accordian]?.[param];

  const componentsWithConditionalStyles = [
    'DropDown',
    'Form',
    'Listview',
    'TextInput',
    'NumberInput',
    'PasswordInput',
    'EmailInput',
    'PhoneInput',
    'CurrencyInput',
    'ToggleSwitchV2',
    'Checkbox',
    'Table',
    'DropdownV2',
    'MultiselectV2',
    'RadioButtonV2',
    'Button',
    'Image',
    'ModalV2',
    'RangeSlider',
    'FilePicker',
  ];

  if (componentsWithConditionalStyles.includes(componentConfig.component)) {
    const paramTypeConfig = componentMeta[paramType] || {};
    const paramConfig = paramTypeConfig[param] || {};
    const { conditionallyRender = null } = paramConfig;

    const getResolvedValue = (key) => {
      const paramDef = paramTypeDefinition?.[key];
      if (paramDef && typeof paramDef.value !== 'undefined') {
        return resolveReferences(paramDef.value, currentState, components);
      }
      return resolveReferences(paramDef, currentState, components);
    };

    const evaluateCondition = (condition) => {
      const { key, value, comparator = 'eq' } = condition;

      const resolvedValue = getResolvedValue(key);

      switch (comparator) {
        case 'eq':
          return resolvedValue === value;
        case 'ne':
          return resolvedValue !== value;
        case 'in':
          return Array.isArray(value) && value.includes(resolvedValue);
        case 'not-in':
          return Array.isArray(value) && !value.includes(resolvedValue);
        default:
          return false;
      }
    };

    if (conditionallyRender) {
      if (Array.isArray(conditionallyRender)) {
        const shouldHide = conditionallyRender.some((condition) => !evaluateCondition(condition));
        if (shouldHide) {
          return;
        }
      } else {
        let shouldRender = evaluateCondition(conditionallyRender);

        if (conditionallyRender.and) {
          shouldRender = shouldRender && evaluateCondition(conditionallyRender.and);
        }

        if (!shouldRender) {
          return;
        }
      }
    }
  }

  return (
    <>
      <Code
        param={{ name: param, ...component.component.properties?.[param] }}
        definition={definition}
        dataQueries={dataQueries}
        onChange={paramUpdated}
        paramType={paramType}
        components={components}
        componentMeta={componentMeta}
        darkMode={darkMode}
        componentName={component.component.name || null}
        type={meta?.type}
        fxActive={definition.fxActive ?? false}
        onFxPress={(active) => {
          paramUpdated({ name: param, ...component.component.properties[param] }, 'fxActive', active, paramType);
        }}
        component={component}
        accordian={accordian}
        placeholder={placeholder}
        customMeta={customMeta}
      />
    </>
  );
}

export function renderElement(
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  param,
  paramType,
  currentState,
  components = {},
  darkMode = false,
  placeholder = '',
  validationFn,
  setCodeEditorView = null,
  customMeta = null
) {
  const componentConfig = component.component;
  const componentDefinition = componentConfig.definition;
  const paramTypeDefinition = componentDefinition[paramType] || {};
  const definition = paramTypeDefinition[param] || {};
  const meta = componentMeta[paramType][param];
  const isHidden = component.component.properties[param]?.isHidden ?? false;

  if (
    componentConfig.component == 'DropDown' ||
    componentConfig.component == 'Form' ||
    componentConfig.component == 'Listview' ||
    componentConfig.component == 'Image' ||
    componentConfig.component == 'RangeSlider'
  ) {
    const paramTypeConfig = componentMeta[paramType] || {};
    const paramConfig = paramTypeConfig[param] || {};
    const { conditionallyRender = null } = paramConfig;

    if (conditionallyRender) {
      const { key, value } = conditionallyRender;
      if (paramTypeDefinition?.[key] ?? value) {
        const resolvedValue = paramTypeDefinition?.[key] && resolveReferences(paramTypeDefinition?.[key]);
        if (resolvedValue?.value !== value) return;
      }
    }
  }

  return (
    <Code
      param={{ name: param, ...component.component.properties?.[param] }}
      definition={definition}
      dataQueries={dataQueries}
      onChange={paramUpdated}
      paramType={paramType}
      components={components}
      componentMeta={componentMeta}
      darkMode={darkMode}
      componentName={component.component.name || null}
      type={meta?.type}
      fxActive={definition.fxActive ?? false}
      onFxPress={(active) => {
        paramUpdated({ name: param, ...component.component.properties[param] }, 'fxActive', active, paramType);
      }}
      component={component}
      placeholder={placeholder}
      validationFn={validationFn}
      isHidden={isHidden}
      setCodeEditorView={setCodeEditorView}
      customMeta={customMeta}
    />
  );
}
