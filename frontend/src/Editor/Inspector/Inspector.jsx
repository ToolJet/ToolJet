import React, { useState, useEffect } from 'react';
import { componentTypes } from '../Components/components';
import { Table } from './Components/Table';
import { Chart } from './Components/Chart';
import { renderElement } from './Utils';
import { toast } from 'react-toastify';
import { validateQueryName, convertToKebabCase } from '@/_helpers/utils';
import { EventManager } from './EventManager';

export const Inspector = ({
  selectedComponentId,
  componentDefinitionChanged,
  dataQueries,
  removeComponent,
  allComponents,
  componentChanged,
  currentState,
  apps,
  darkMode,
  switchSidebarTab
}) => {

  const selectedComponent = { id: selectedComponentId, component: allComponents[selectedComponentId].component, layouts: allComponents[selectedComponentId].layouts}
  const [component, setComponent] = useState(selectedComponent);

  const [components, setComponents] = useState(allComponents);
  
  const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

  useEffect(() => {
    setComponent(selectedComponent);
  }, [selectedComponent.component.definition]);

  useEffect(() => {
    setComponents(allComponents);
  }, [allComponents]);

  function handleComponentNameChange(newName) {
    if (validateQueryName(newName)) {
      let newComponent = { ...component };
      newComponent.component.name = newName;
      setComponent(newComponent);
      componentChanged(newComponent);
    } else {
      toast.error('Invalid query name. Should be unique and only include letters, numbers and underscore.', { hideProgressBar: true });
    }
  }

  function paramUpdated(param, attr, value, paramType) {
    let newDefinition = { ...component.component.definition };

    let allParams = newDefinition[paramType] || {};
    const paramObject = allParams[param.name];

    if (!paramObject) {
      allParams[param.name] = {};
    }

    if(attr) {
      allParams[param.name][attr] = value;
    } else {
      allParams[param.name] = value;
    }

    newDefinition[paramType] = allParams;

    let newComponent = {
      ...component,
      component: {
        ...component.component,
        definition: newDefinition
      }
    };

    setComponent(newComponent);
    componentDefinitionChanged(newComponent);
  }

  function layoutPropertyChanged(param, attr, value, paramType) { 
    paramUpdated(param, attr, value, paramType);

    // User wants to show the widget on mobile devices
    if(param.name === 'showOnMobile' && value === true) { 
      
      let newComponent = {
        ...component
      };

      const { width, height } = newComponent.layouts['desktop'];

      newComponent['layouts'] = {
        ...newComponent.layouts,
        mobile: { 
          top: 100, 
          left: 0, 
          width: Math.min(width, 445), 
          height: height
        }
      }

      setComponent(newComponent);
      componentDefinitionChanged(newComponent).then(() => {
        
        //  Child componets should also have a mobile layout
        const childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent === component.id);

        childComponents.forEach((componentId) => {
          let newChild = {
            id: componentId,
            ...allComponents[componentId]
          };

          const { width, height } = newChild.layouts['desktop'];

          newChild['layouts'] = {
            ...newChild.layouts,
            mobile: { 
              top: 100, 
              left: 0, 
              width: Math.min(width, 445), 
              height: height
            }
          }

          componentDefinitionChanged(newChild);

        });
      });

    }
  }

  function eventUpdated(event, actionId) {
    let newDefinition = { ...component.component.definition };
    newDefinition.events[event.name] = { actionId };

    let newComponent = {
      ...component
    };

    setComponent(newComponent);
    componentDefinitionChanged(newComponent);
  }

  function eventsChanged(newEvents) {
    let newDefinition = { ...component.component.definition };
    newDefinition.events = newEvents;

    let newComponent = {
      ...component
    };

    setComponent(newComponent);
    componentDefinitionChanged(newComponent);
  }

  function eventOptionUpdated(event, option, value) {
    console.log('eventOptionUpdated', event, option, value);

    let newDefinition = { ...component.component.definition };
    let eventDefinition = newDefinition.events[event.name] || { options: {} };

    newDefinition.events[event.name] = { ...eventDefinition, options: { ...eventDefinition.options, [option]: value } };

    let newComponent = {
      ...component
    };

    setComponent(newComponent);
    componentDefinitionChanged(newComponent);
  }

  return (
    <div className="inspector">
      <div className="header px-2 py-1 row">
        <div className="col-auto">
            <div className="input-icon">
                <input
                    type="text"
                    onChange={(e) => handleComponentNameChange(e.target.value)}
                    className="form-control-plaintext form-control-plaintext-sm mt-1"
                    value={component.component.name}
                />
                <span className="input-icon-addon">
                    <img src="/assets/images/icons/edit-source.svg" width="12" height="12" />
                </span>
            </div>
        </div>
        <div className="col py-1">
          <button 
            className="btn btn-sm component-action-button btn-light"
            onClick={() => switchSidebarTab(2)}
          >
            x
          </button>
        </div>

      </div>

      {componentMeta.component === 'Table' &&
        <Table
          component={component}
          paramUpdated={paramUpdated}
          dataQueries={dataQueries}
          componentMeta={componentMeta}
          eventUpdated={eventUpdated}
          eventOptionUpdated={eventOptionUpdated}
          components={components}
          currentState={currentState}
          darkMode={darkMode}
          eventsChanged={eventsChanged}
          apps={apps}
        />
      }

      {componentMeta.component === 'Chart' &&
        <Chart
          component={component}
          paramUpdated={paramUpdated}
          dataQueries={dataQueries}
          componentMeta={componentMeta}
          eventUpdated={eventUpdated}
          eventOptionUpdated={eventOptionUpdated}
          components={components}
          currentState={currentState}
          darkMode={darkMode}
        />
      }
        
      {!['Table', 'Chart'].includes(componentMeta.component)   && 
        <div className="properties-container p-2">
          {Object.keys(componentMeta.properties).map((property) => renderElement(component, componentMeta, paramUpdated, dataQueries, property, 'properties', currentState, components, darkMode))}
          
          {Object.keys(componentMeta.styles).length > 0 && <div className="hr-text">Style</div>}
          {Object.keys(componentMeta.styles).map((style) => renderElement(component, componentMeta, paramUpdated, dataQueries, style, 'styles', currentState, components))}

          {Object.keys(componentMeta.events).length > 0 &&
            <div>
              {Object.keys(componentMeta.events).length > 0 && <div className="hr-text">Events</div>}

              <EventManager
                component={component}
                componentMeta={componentMeta}
                currentState={currentState}
                dataQueries={dataQueries}
                components={components}
                eventsChanged={eventsChanged}
                apps={apps}
              />
            </div>
          }

          {Object.keys(componentMeta.validation || {}).length > 0 && 
            <div>
              <div className="hr-text">Validation</div>
              {Object.keys(componentMeta.validation).map((property) => renderElement(component, componentMeta, paramUpdated, dataQueries, property, 'validation', currentState, components, darkMode))}
            </div>
          }
            
        
        </div>
      }

      {/* Show on desktop & show on mobile params */}
      <div className="hr-text">Layout</div>
      <div className="properties-container p-2 pb-3 mb-5">
        {renderElement(component, componentMeta, layoutPropertyChanged, dataQueries, 'showOnDesktop', 'others', currentState, components)}
        {renderElement(component, componentMeta, layoutPropertyChanged, dataQueries, 'showOnMobile', 'others', currentState, components)}
      </div>

      <div className="widget-documentation-link p-2">
        <a href={`https://docs.tooljet.io/docs/widgets/${convertToKebabCase(componentMeta?.name ?? '')}`} target="_blank">
          <small>
            {componentMeta.name} documentation
          </small>
        </a>
      </div>
    </div>
  );
};
