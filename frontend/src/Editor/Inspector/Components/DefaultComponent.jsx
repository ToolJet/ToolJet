import React from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { resolveReferences } from '@/_helpers/utils';

export const DefaultComponent = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    components,
    pages,
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
    components,
    validations,
    darkMode,
    pages
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
  darkMode,
  pages
) => {
  // Add widget title to section key to filter that property section from specified widgets' settings
  const accordionFilters = {
    Properties: [],
    Events: [],
    Validation: [],
    General: ['Modal'],
    Layout: [],
  };
  if (component.component.component === 'Listview') {
    if (!resolveReferences(component.component.definition.properties?.enablePagination?.value, currentState)) {
      properties = properties.filter((property) => property !== 'rowsPerPage');
    }
  }
  let items = [];
  if (properties.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.properties', 'Properties')}`,
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
      title: `${i18next.t('widget.common.events', 'Events')}`,
      isOpen: true,
      children: (
        <EventManager
          sourceId={component?.id}
          eventSourceType="component"
          eventMetaDefinition={componentMeta}
          currentState={currentState}
          dataQueries={dataQueries}
          components={allComponents}
          eventsChanged={eventsChanged}
          apps={apps}
          darkMode={darkMode}
          pages={pages}
        />
      ),
    });
  }

  if (validations.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.validation', 'Validation')}`,
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
    title: `${i18next.t('widget.common.general', 'General')}`,
    isOpen: true,
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
    title: `${i18next.t('widget.common.layout', 'Layout')}`,
    isOpen: true,
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
