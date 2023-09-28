import React from 'react';
import Accordion from '@/_ui/Accordion';
import { renderElement } from '../Utils';
import { baseComponentProperties } from './DefaultComponent';
import { resolveReferences } from '@/_helpers/utils';

export const FilePicker = ({ componentMeta, darkMode, ...restProps }) => {
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

  const renderCustomElement = (param, paramType = 'properties') => {
    return renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState);
  };
  const conditionalAccordionItems = (component) => {
    const parseContent = resolveReferences({
      object: component.component.definition.properties.parseContent?.value ?? false,
      currentState,
    });
    const accordionItems = [];
    const options = ['parseContent'];

    let renderOptions = [];

    options.map((option) => renderOptions.push(renderCustomElement(option)));

    const conditionalOptions = [{ name: 'parseFileType', condition: parseContent }];

    conditionalOptions.map(({ name, condition }) => {
      if (condition) renderOptions.push(renderCustomElement(name));
    });

    accordionItems.push({
      title: 'Options',
      children: renderOptions,
    });
    return accordionItems;
  };

  const properties = Object.keys(componentMeta.properties);
  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const filteredProperties = properties.filter(
    (property) => property !== 'parseContent' && property !== 'parseFileType'
  );

  const accordionItems = baseComponentProperties(
    filteredProperties,
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
    darkMode
  );

  accordionItems.splice(1, 0, ...conditionalAccordionItems(component));

  return <Accordion items={accordionItems} />;
};
