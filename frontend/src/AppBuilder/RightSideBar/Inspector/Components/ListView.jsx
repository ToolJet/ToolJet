import React, { useState, useRef, useCallback } from 'react';
import { baseComponentProperties } from './DefaultComponent';
import Accordion from '@/_ui/Accordion';
import { resolveReferences } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { renderElement } from '../Utils';
import { Code } from '../Elements/Code';

const PROPERTIES_VS_ACCORDION_TITLE = {
  Listview: 'Data',
};

export const ListView = ({ componentMeta, darkMode, ...restProps }) => {
  const { component, paramUpdated, dataQueries, currentState, pages, components } = restProps;

  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldForceCodeBox] = useState(() => {
    const generateDataFrom = component?.component?.definition?.properties?.generateDataFrom?.value;
    const queryId = component?.component?.definition?.properties?.queryId?.value;
    return generateDataFrom === 'query' && queryId;
  });
  const currentStatusRef = useRef('');

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (componentMeta?.definition === undefined) {
    setSelectedComponents([]);
    return null;
  }

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});
  let properties = [];
  let additionalActions = [];

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else {
      properties.push(key);
    }
  }

  if (component.component.component === 'Listview') {
    if (!resolveReferences(component.component.definition.properties?.enablePagination?.value)) {
      properties = properties.filter((property) => property !== 'rowsPerPage');
    }
  }

  const renderDataProperty = (property) => {
    if (property === 'data' && shouldForceCodeBox) {
      const componentConfig = component.component;
      const componentDefinition = componentConfig.definition;
      const paramTypeDefinition = componentDefinition['properties'] || {};
      const definition = paramTypeDefinition[property] || {};
      const meta = componentMeta['properties'][property];

      const forcedDefinition = { ...definition, fxActive: true };

      return (
        <Code
          key={property}
          param={{ name: property, ...component.component.properties?.[property] }}
          definition={forcedDefinition}
          dataQueries={dataQueries}
          onChange={paramUpdated}
          paramType="properties"
          components={components}
          componentMeta={componentMeta}
          darkMode={darkMode}
          componentName={component.component.name || null}
          type={meta?.type}
          fxActive={true}
          onFxPress={(active) => {
            paramUpdated(
              { name: property, ...component.component.properties[property] },
              'fxActive',
              active,
              'properties'
            );
          }}
          component={component}
          placeholder=""
        />
      );
    }

    return renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      property,
      'properties',
      currentState,
      components,
      darkMode,
      ''
    );
  };

  const renderGenerateDataFromProperty = (property) => {
    if (property === 'generateDataFrom') {
      const generateDataFrom = component?.component?.definition?.properties?.generateDataFrom?.value;
      const queryId = component?.component?.definition?.properties?.queryId?.value;

      if (generateDataFrom === 'query' && queryId) {
        return (
          <div key={property}>
            {renderElement(
              component,
              componentMeta,
              paramUpdated,
              dataQueries,
              property,
              'properties',
              currentState,
              components,
              darkMode,
              ''
            )}
            <div className="tw-mt-2 tw-flex tw-justify-end">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  currentStatusRef.current = 'MANAGE_COLUMNS';
                  setIsModalOpen(true);
                }}
              >
                Configure columns
              </button>
            </div>
          </div>
        );
      }
    }

    return renderElement(
      component,
      componentMeta,
      paramUpdated,
      dataQueries,
      property,
      'properties',
      currentState,
      components,
      darkMode,
      ''
    );
  };

  let items = [];

  if (properties.length > 0) {
    items.push({
      title: PROPERTIES_VS_ACCORDION_TITLE[component?.component?.component] ?? 'Properties',
      children: properties.map((property) => {
        if (property === 'data') {
          return renderDataProperty(property);
        } else if (property === 'generateDataFrom') {
          return renderGenerateDataFromProperty(property);
        } else {
          return renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            property,
            'properties',
            currentState,
            components,
            darkMode,
            ''
          );
        }
      }),
    });
  }

  const additionalItems = baseComponentProperties(
    [],
    events,
    component,
    componentMeta,
    restProps.layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    restProps.eventsChanged,
    restProps.apps,
    components,
    validations,
    darkMode,
    pages,
    additionalActions
  ).filter((item) => item.title !== 'Properties' && item.title !== 'Data');

  items = [...items, ...additionalItems];

  return (
    <>
      <Accordion items={items} />
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Configure ListView Columns</h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>ListView column configuration will be implemented here.</p>
                <p>This will allow you to:</p>
                <ul>
                  <li>Configure which data fields to display</li>
                  <li>Set column headers and formatting</li>
                  <li>Arrange column order</li>
                  <li>Configure display styles</li>
                </ul>
                <p className="text-muted">
                  Currently using query: <code>{component?.component?.definition?.properties?.queryId?.value}</code>
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={closeModal}>
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
