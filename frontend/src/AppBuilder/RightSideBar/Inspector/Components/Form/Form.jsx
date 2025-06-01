import React, { useEffect, useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { renderElement } from '../../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import DataSectionUI from './DataSectionUI';
import DataSectionWrapper from './DataSectionWrapper';
import './styles.scss';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';

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
  const resolveReferences = useStore((state) => state.resolveReferences, shallow);
  const getFormDataSectionData = useStore((state) => state.getFormDataSectionData, shallow);
  const setFormDataSectionData = useStore((state) => state.setFormDataSectionData, shallow);
  const componentNameIdMapping = useStore((state) => state.modules.canvas.componentNameIdMapping, shallow);
  const queryNameIdMapping = useStore((state) => state.modules.canvas.queryNameIdMapping, shallow);

  const [source, setSource] = useState({
    value: component.component.definition.properties?.generateFormFrom?.value,
    fxActive: component.component.definition.properties?.generateFormFrom?.fxActive,
  });

  const resolvedSource = resolveReferences('canvas', component.component.definition.properties?.generateFormFrom.value);

  const [JSONData, setJSONData] = useState({
    value: resolvedSource === 'rawJson' ? component.component.definition.properties?.JSONData?.value : resolvedSource,
  });

  const tempComponentMeta = deepClone(componentMeta);

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const resolvedCustomSchema = resolveReferences('canvas', component.component.definition.properties.advanced.value);

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'data') {
      dataProperties.push(key);
    } else {
      // Skip the fields property as it is handled separately
      if (key === 'fields') continue;
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

  if (resolvedCustomSchema) {
    component.component.properties.showHeader = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
    component.component.properties.showFooter = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
  }

  const paramUpdatedInterceptor = (param, attr, value, paramType, ...restArgs) => {
    // Need not to auto save if the param is JSONData and generateFormFrom is rawJson
    // Saving will happen when they either click the Generate Form button or Refresh data button
    if (param?.name === 'generateFormFrom') {
      const res = extractAndReplaceReferencesFromString(value, componentNameIdMapping, queryNameIdMapping);
      if (attr === 'value') {
        const { generateFormFrom, JSONData } = getFormDataSectionData(component?.id);
        setSource((prev) => ({ ...prev, value: res.valueWithId }));
        if (value === generateFormFrom?.value) {
          return setJSONData({ value: JSONData.value });
        }
        if (value !== 'rawJson') {
          const resolvedValue = resolveReferences('canvas', value);
          setJSONData({ value: resolvedValue });
        } else {
          setJSONData({
            value:
              "{{{ 'name': 'John Doe', 'age': 35, 'isActive': true, 'dob': '01-01-1990', 'hobbies': ['reading', 'gaming', 'cycling'], 'address': { 'street': '123 Main Street', 'city': 'New York' } }}}",
          });
        }
      } else if (attr === 'fxActive') {
        setSource((prev) => ({ ...prev, fxActive: value }));
      }
      return;
    }
    if (param.name === 'JSONData') {
      if (attr === 'value') {
        setJSONData({ value });
      }
      return;
    }

    paramUpdated(param, attr, value, paramType, ...restArgs);
  };

  const saveDataSection = (fields) => {
    setFormDataSectionData(
      component?.id,
      {
        generateFormFrom: source,
        JSONData: JSONData,
      },
      fields
    );
  };

  const renderDataElement = () => {
    return (
      <>
        {dataProperties?.map((property) => {
          // Mutating the component definition properties to set the generateFormFrom source as we're not saving it to DB unless the user clicks the Generate Form/Refersh data button
          component.component.definition.properties.generateFormFrom = source;
          component.component.definition.properties.JSONData = JSONData;

          return renderElement(
            component,
            componentMeta,
            paramUpdatedInterceptor,
            dataQueries,
            property,
            'properties',
            currentState,
            allComponents,
            darkMode
          );
        })}
        <DataSectionWrapper
          source={source}
          JSONData={JSONData}
          component={component}
          paramUpdated={paramUpdatedInterceptor}
          darkMode={darkMode}
          saveDataSection={saveDataSection}
        />
      </>
    );
  };

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
    resolvedCustomSchema,
    renderDataElement
  );

  return (
    <>
      <Accordion items={accordionItems} />
    </>
  );
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
  resolvedCustomSchema,
  renderDataElement
) => {
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

  if (!resolvedCustomSchema) {
    items.push({
      title: 'Data',
      isOpen: true,
      children: renderDataElement(),
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
