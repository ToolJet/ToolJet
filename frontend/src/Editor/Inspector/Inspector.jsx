import React, { useState, useEffect } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { componentTypes } from '../Components/components';
import { Table } from './Components/Table';
import { Chart } from './Components/Chart';
import { renderElement } from './Utils';
import { toast } from 'react-hot-toast';
import { validateQueryName, convertToKebabCase } from '@/_helpers/utils';
import { EventManager } from './EventManager';
import { ConfirmDialog } from '@/_components';
import { useHotkeys } from 'react-hotkeys-hook';
import Accordion from '@/_ui/Accordion';

export const Inspector = ({
  selectedComponentId,
  componentDefinitionChanged,
  dataQueries,
  allComponents,
  componentChanged,
  currentState,
  apps,
  darkMode,
  switchSidebarTab,
  removeComponent,
}) => {
  const component = {
    id: selectedComponentId,
    component: allComponents[selectedComponentId].component,
    layouts: allComponents[selectedComponentId].layouts,
  };
  // const [component, setComponent] = useState(selectedComponent);
  const [showWidgetDeleteConfirmation, setWidgetDeleteConfirmation] = useState(false);
  // const [components, setComponents] = useState(allComponents);
  const [key, setKey] = React.useState('properties');

  useHotkeys('backspace', () => setWidgetDeleteConfirmation(true));

  const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

  // useEffect(() => {
  //   setComponent(selectedComponent);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedComponent.component.definition]);

  // useEffect(() => {
  //   setComponents(allComponents);
  // }, [allComponents]);

  function handleComponentNameChange(newName) {
    if (validateQueryName(newName)) {
      let newComponent = { ...component };
      newComponent.component.name = newName;

      componentChanged(newComponent);
    } else {
      toast.error('Invalid query name. Should be unique and only include letters, numbers and underscore.');
    }
  }

  function paramUpdated(param, attr, value, paramType) {
    let newDefinition = { ...component.component.definition };

    let allParams = newDefinition[paramType] || {};
    const paramObject = allParams[param.name];

    if (!paramObject) {
      allParams[param.name] = {};
    }

    if (attr) {
      allParams[param.name][attr] = value;
    } else {
      allParams[param.name] = value;
    }

    newDefinition[paramType] = allParams;

    let newComponent = {
      ...component,
      component: {
        ...component.component,
        definition: newDefinition,
      },
    };

    componentDefinitionChanged(newComponent);
  }

  function layoutPropertyChanged(param, attr, value, paramType) {
    paramUpdated(param, attr, value, paramType);

    // User wants to show the widget on mobile devices
    if (param.name === 'showOnMobile' && value === true) {
      let newComponent = {
        ...component,
      };

      const { width, height } = newComponent.layouts['desktop'];

      newComponent['layouts'] = {
        ...newComponent.layouts,
        mobile: {
          top: 100,
          left: 0,
          width: Math.min(width, 445),
          height: height,
        },
      };

      componentDefinitionChanged(newComponent).then(() => {
        //  Child componets should also have a mobile layout
        const childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent === component.id);

        childComponents.forEach((componentId) => {
          let newChild = {
            id: componentId,
            ...allComponents[componentId],
          };

          const { width, height } = newChild.layouts['desktop'];

          newChild['layouts'] = {
            ...newChild.layouts,
            mobile: {
              top: 100,
              left: 0,
              width: Math.min(width, 445),
              height: height,
            },
          };

          componentDefinitionChanged(newChild);
        });
      });
    }
  }

  function eventUpdated(event, actionId) {
    let newDefinition = { ...component.component.definition };
    newDefinition.events[event.name] = { actionId };

    let newComponent = {
      ...component,
    };

    componentDefinitionChanged(newComponent);
  }

  function eventsChanged(newEvents) {
    let newDefinition = { ...component.component.definition };
    newDefinition.events = newEvents;

    let newComponent = {
      ...component,
    };

    componentDefinitionChanged(newComponent);
  }

  function eventOptionUpdated(event, option, value) {
    console.log('eventOptionUpdated', event, option, value);

    let newDefinition = { ...component.component.definition };
    let eventDefinition = newDefinition.events[event.name] || { options: {} };

    newDefinition.events[event.name] = { ...eventDefinition, options: { ...eventDefinition.options, [option]: value } };

    let newComponent = {
      ...component,
    };

    componentDefinitionChanged(newComponent);
  }

  function getAccordion(componentName) {
    switch (componentName) {
      case 'Table':
        return (
          <Table
            layoutPropertyChanged={layoutPropertyChanged}
            component={component}
            paramUpdated={paramUpdated}
            dataQueries={dataQueries}
            componentMeta={componentMeta}
            eventUpdated={eventUpdated}
            eventOptionUpdated={eventOptionUpdated}
            components={allComponents}
            currentState={currentState}
            darkMode={darkMode}
            eventsChanged={eventsChanged}
            apps={apps}
          />
        );

      case 'Chart':
        return (
          <Chart
            layoutPropertyChanged={layoutPropertyChanged}
            component={component}
            paramUpdated={paramUpdated}
            dataQueries={dataQueries}
            componentMeta={componentMeta}
            eventUpdated={eventUpdated}
            eventOptionUpdated={eventOptionUpdated}
            components={allComponents}
            currentState={currentState}
            darkMode={darkMode}
          />
        );

      default: {
        const properties = Object.keys(componentMeta.properties);
        const events = Object.keys(componentMeta.events);
        const validations = Object.keys(componentMeta.validation || {});
        let items = [];
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

        return <Accordion items={items} />;
      }
    }
  }

  return (
    <div className="inspector">
      <ConfirmDialog
        show={showWidgetDeleteConfirmation}
        message={'Widget will be deleted, do you want to continue?'}
        onConfirm={() => {
          switchSidebarTab(2);
          removeComponent(component);
        }}
        onCancel={() => setWidgetDeleteConfirmation(false)}
      />
      <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="tabs-inspector">
        <Tab style={{ marginBottom: 100 }} eventKey="properties" title="Properties">
          <div className="header py-1 row">
            <div>
              <div className="input-icon">
                <input
                  type="text"
                  onChange={(e) => handleComponentNameChange(e.target.value)}
                  className="w-100 form-control-plaintext form-control-plaintext-sm mt-1"
                  value={component.component.name}
                />
                <span className="input-icon-addon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13.1667 3.11667L10.8833 0.833337C10.5853 0.553417 10.1948 0.392803 9.78611 0.382047C9.3774 0.371291 8.97899 0.511145 8.66667 0.775004L1.16667 8.275C0.897308 8.54664 0.72959 8.90267 0.69167 9.28334L0.333336 12.7583C0.322111 12.8804 0.337948 13.0034 0.379721 13.1187C0.421493 13.2339 0.488172 13.3385 0.575003 13.425C0.65287 13.5022 0.745217 13.5633 0.846748 13.6048C0.948279 13.6463 1.057 13.6673 1.16667 13.6667H1.24167L4.71667 13.35C5.09733 13.3121 5.45337 13.1444 5.725 12.875L13.225 5.375C13.5161 5.06748 13.6734 4.65709 13.6625 4.23378C13.6516 3.81047 13.4733 3.40876 13.1667 3.11667ZM4.56667 11.6833L2.06667 11.9167L2.29167 9.41667L7 4.76667L9.25 7.01667L4.56667 11.6833ZM10.3333 5.9L8.1 3.66667L9.725 2L12 4.275L10.3333 5.9Z"
                      fill="#8092AC"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          {getAccordion(componentMeta.component)}
        </Tab>
        <Tab eventKey="styles" title="Styles">
          <div className="p-3">
            {Object.keys(componentMeta.styles).map((style) =>
              renderElement(
                component,
                componentMeta,
                paramUpdated,
                dataQueries,
                style,
                'styles',
                currentState,
                allComponents
              )
            )}
          </div>
        </Tab>
      </Tabs>
      <div className="widget-documentation-link p-2">
        <a
          href={`https://docs.tooljet.io/docs/widgets/${convertToKebabCase(componentMeta?.name ?? '')}`}
          target="_blank"
          rel="noreferrer"
        >
          <small>{componentMeta.name} documentation</small>
        </a>
      </div>
    </div>
  );
};
