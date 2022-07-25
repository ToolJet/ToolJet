import React from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';

export const DefaultComponent = ({ componentMeta, darkMode, ...restProps }) => {
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

  const properties = Object.keys(componentMeta.properties);
  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const accordionItems = baseComponentProperties(
    properties,
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

  return <Accordion items={accordionItems} />;
};

export const baseComponentProperties = (
  properties,
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
) => {
  // Add widget title to section key to filter that property section from specified widgets' settings
  const accordionFilters = {
    Properties: [],
    Events: [],
    Validation: [],
    General: ['Modal'],
    Layout: [],
  };
  let items = [];
  if (properties.length > 0) {
    items.push({
      title: 'Properties',
      children: properties.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'properties',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  if (events.length > 0) {
    items.push({
      title: 'Events',
      isOpen: false,
      children: (
        <EventManager
          component={component}
          componentMeta={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
        />
      ),
    });
  }

  if (validations.length > 0) {
    items.push({
      title: 'Validation',
      children: validations.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'validation',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  items.push({
    title: 'General',
    isOpen: false,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'tooltip',
          'general',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  items.push({
    title: 'Layout',
    isOpen: false,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnDesktop',
          'others',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  return items.filter(
    (item) => !(item.title in accordionFilters && accordionFilters[item.title].includes(componentMeta.component))
  );
};
