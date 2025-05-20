import React from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { renderElement } from '../../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { Button } from '@/components/ui/Button/Button';
import LabeledDivider from './LabeledDivider';

export const Form = ({
  componentMeta,
  darkMode,
  layoutPropertyChanged,
  component,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  pages,
}) => {
  const tempComponentMeta = deepClone(componentMeta);

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'data') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }

  const { id } = component;
  const newOptions = [{ name: 'None', value: 'none' }];

  Object.entries(allComponents).forEach(([componentId, _component]) => {
    const validParent =
      _component.component.parent === id ||
      _component.component.parent === `${id}-footer` ||
      _component.component.parent === `${id}-header`;
    if (validParent && _component?.component?.component === 'Button') {
      newOptions.push({ name: _component.component.name, value: componentId });
    }
  });

  tempComponentMeta.properties.buttonToSubmit.options = newOptions;

  // Hide header footer if custom schema is turned on

  if (component.component.definition.properties.advanced.value === '{{true}}') {
    component.component.properties.showHeader = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
    component.component.properties.showFooter = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
  }

  const accordionItems = baseComponentProperties(
    properties,
    events,
    component,
    tempComponentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    pages,
    additionalActions,
    dataProperties
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
  pages,
  additionalActions,
  dataProperties
) => {
  let items = [];

  const renderDataPropeties = () =>
    dataProperties?.map((property) =>
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
    );

  const renderDataElement = () => {
    return (
      <>
        {renderDataPropeties()}
        <div className="tw-flex tw-justify-center tw-items-center">
          <Button
            fill="#4368E3"
            leadingIcon="plus"
            isLoading={true}
            disabled
            variant="secondary"
            loaderText="Generating"
            onClick={() => {}}
          >
            Generate form
          </Button>
        </div>
        <div className="tw-flex tw-justify-between tw-items-center tw-gap-1.5">
          <div className="tw-flex-1">
            <LabeledDivider label="Fields" />
          </div>
          <Button iconOnly leadingIcon="plus" variant="ghost" size="small" />
        </div>
        <span className="base-regular text-placeholder tw-block tw-p-3 tw-text-center">
          No fields yet. Generate a form from a data source or add custom fields.
        </span>
      </>
    );
  };

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

  items.push({
    title: 'Data',
    isOpen: true,
    children: renderDataElement(),
  });

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

  items.push({
    title: 'Additional actions',
    isOpen: true,
    children: additionalActions?.map((property) =>
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
    title: `${i18next.t('widget.common.devices', 'Devices')}`,
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

  return items;
};
