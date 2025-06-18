import React, { useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { renderElement } from '../../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import DataSectionWrapper from './_components/DataSectionWrapper';
import './styles.scss';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { INPUT_COMPONENTS_FOR_FORM } from './constants';
import { findFirstKeyValuePairWithPath } from './utils/utils';

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
  const saveFormDataSectionData = useStore((state) => state.saveFormDataSectionData, shallow);
  const componentNameIdMapping = useStore((state) => state.modules.canvas.componentNameIdMapping, shallow);
  const queryNameIdMapping = useStore((state) => state.modules.canvas.queryNameIdMapping, shallow);
  const getChildComponents = useStore((state) => state.getChildComponents, shallow);
  const saveFormFields = useStore((state) => state.saveFormFields, shallow);

  const [source, setSource] = useState({
    value: component.component.definition.properties?.generateFormFrom?.value,
    fxActive: component.component.definition.properties?.generateFormFrom?.fxActive,
  });

  const fields = component.component.definition.properties?.fields;

  // Added this to backfill fields if not present
  if (fields === undefined) {
    const newFields = [];
    const childComponents = getChildComponents(component.id);
    Object.keys(childComponents).forEach((childId) => {
      if (INPUT_COMPONENTS_FOR_FORM.includes(childComponents[childId].component.component.component)) {
        newFields.push({
          componentId: childId,
          isCustomField: true,
        });
      }
    });
    saveFormFields(component.id, newFields);
  }

  const resolvedSource = resolveReferences(
    'canvas',
    component.component.definition.properties?.generateFormFrom?.value
  );

  const [JSONData, setJSONData] = useState({
    value: resolvedSource === 'rawJson' ? component.component.definition.properties?.JSONData?.value : resolvedSource,
  });

  const tempComponentMeta = deepClone(componentMeta);

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];
  let deprecatedProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  const resolvedCustomSchema = resolveReferences('canvas', component.component.definition.properties.advanced.value);

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'data') {
      dataProperties.push(key);
    } else if (componentMeta?.properties[key]?.section === 'deprecated') {
      deprecatedProperties.push(key);
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
      let { valueWithId: selectedQuery } = res;
      if (attr === 'value') {
        const { generateFormFrom, JSONData } = getFormDataSectionData(component?.id);
        if (value === generateFormFrom?.value) {
          return setJSONData({ value: JSONData.value });
        }
        if (value !== 'rawJson') {
          const resolvedValue = resolveReferences('canvas', value);
          if (!source?.fxActive) {
            const transformedData = findFirstKeyValuePairWithPath(resolvedValue, selectedQuery);
            setJSONData({ value: transformedData.value });
            return setSource((prev) => ({ ...prev, value: transformedData.path }));
          }
          setJSONData({ value: resolvedValue });
        } else {
          setJSONData({
            value:
              "{{{ 'name': 'John Doe', 'age': 35, 'isActive': true, 'dob': '01-01-1990', 'hobbies': ['reading', 'gaming', 'cycling'], 'address': { 'street': '123 Main Street', 'city': 'New York' } }}}",
          });
        }
        setSource((prev) => ({ ...prev, value: selectedQuery }));
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
    saveFormDataSectionData(
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
      <div className={`${resolvedCustomSchema ? 'tw-pointer-events-none opacity-60' : ''}`}>
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
      </div>
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
    deprecatedProperties,
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
  deprecatedProperties,
  resolvedCustomSchema,
  renderDataElement
) => {
  let items = [];

  if (properties.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.structure', 'Structure')}`,
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

  // if (!resolvedCustomSchema) {
  items.push({
    title: 'Data',
    isOpen: true,
    children: renderDataElement(),
  });
  // }

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

  items.push({
    title: 'Deprecated',
    isOpen: true,
    children: deprecatedProperties?.map((property) =>
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

  return items;
};
