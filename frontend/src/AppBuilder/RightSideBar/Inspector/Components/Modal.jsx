import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';
import { baseComponentProperties } from './DefaultComponent';
import { resolveReferences } from '@/_helpers/utils';

export const Modal = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
  } = restProps;

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.accordian === 'Data') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }

  const renderCustomElement = (param, paramType = 'properties') => {
    return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);
  };
  const conditionalAccordionItems = (component) => {
    const useDefaultButton = resolveReferences(
      component.component.definition.properties.useDefaultButton?.value ?? false
    );
    const accordionItems = [];
    let renderOptions = [];
    const options = ['visibility', 'disabledTrigger', 'useDefaultButton'];

    options.map((option) => renderOptions.push(renderCustomElement(option)));

    const conditionalOptions = [{ name: 'triggerButtonLabel', condition: useDefaultButton }];

    conditionalOptions.map(({ name, condition }) => {
      if (condition) renderOptions.push(renderCustomElement(name));
    });

    accordionItems.push({
      title: 'Trigger',
      children: renderOptions,
    });

    return accordionItems;
  };

  if (component.component.definition.properties.size.value === 'fullscreen') {
    component.component.properties.modalHeight = {
      ...component.component.properties.modalHeight,
      isHidden: true,
    };
  }

  const accordionItems = baseComponentProperties(
    dataProperties,
    events,
    component,
    componentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    [],
    additionalActions
  );

  const [optionsItems] = conditionalAccordionItems(component);
  accordionItems.splice(2, 0, optionsItems);

  return <Accordion items={accordionItems} />;
};
