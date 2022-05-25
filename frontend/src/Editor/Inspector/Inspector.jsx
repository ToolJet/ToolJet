import React, { useState, useRef, useLayoutEffect } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { v4 as uuidv4 } from 'uuid';
import { componentTypes } from '../Components/components';
import { Table } from './Components/Table';
import { Chart } from './Components/Chart';
import { renderElement } from './Utils';
import { toast } from 'react-hot-toast';
import { validateQueryName, convertToKebabCase } from '@/_helpers/utils';
import { ConfirmDialog } from '@/_components';
import { useHotkeys } from 'react-hotkeys-hook';
import { DefaultComponent } from './Components/DefaultComponent';
import { FilePicker } from './Components/FilePicker';
import { CustomComponent } from './Components/CustomComponent';
import useFocus from '@/_hooks/use-Focus';

export const Inspector = ({
  cloneComponent,
  selectedComponentId,
  componentDefinitionChanged,
  dataQueries,
  allComponents,
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
    parent: allComponents[selectedComponentId].parent,
  };
  const [showWidgetDeleteConfirmation, setWidgetDeleteConfirmation] = useState(false);
  const [key, setKey] = React.useState('properties');
  const [tabHeight, setTabHeight] = React.useState(0);
  const tabsRef = useRef(null);
  const [newComponentName, setNewComponentName] = useState(component.component.name);
  const [inputRef, setInputFocus] = useFocus();

  useHotkeys('backspace', () => setWidgetDeleteConfirmation(true));
  useHotkeys('escape', () => switchSidebarTab(2));

  useHotkeys('cmd+d, ctrl+d', (e) => {
    e.preventDefault();
    let clonedComponent = JSON.parse(JSON.stringify(component));
    clonedComponent.id = uuidv4();
    cloneComponent(clonedComponent);

    let childComponents = [];

    if ((component.component.component === 'Tabs') | (component.component.component === 'Calendar')) {
      childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent?.startsWith(component.id));
    } else {
      childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent === component.id);
    }

    childComponents.forEach((componentId) => {
      let childComponent = JSON.parse(JSON.stringify(allComponents[componentId]));
      childComponent.id = uuidv4();

      if ((component.component.component === 'Tabs') | (component.component.component === 'Calendar')) {
        const childTabId = childComponent.parent.split('-').at(-1);
        childComponent.parent = `${clonedComponent.id}-${childTabId}`;
      } else {
        childComponent.parent = clonedComponent.id;
      }
      cloneComponent(childComponent);
    });
    toast.success(`${component.component.name} cloned succesfully`);
    switchSidebarTab(2);
  });

  const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

  useLayoutEffect(() => {
    if (tabsRef.current) {
      setTabHeight(tabsRef.current.querySelector('.nav-tabs').clientHeight);
    }
  }, []);

  const validateComponentName = (name) => {
    const isValid = !Object.values(allComponents)
      .map((component) => component.component.name)
      .includes(name);

    if (component.component.name === name) {
      return true;
    }
    return isValid;
  };

  function handleComponentNameChange(newName) {
    if (newName.length === 0) {
      toast.error('Widget name cannot be empty');
      return setInputFocus();
    }

    if (!validateComponentName(newName)) {
      toast.error('Component name already exists');
      return setInputFocus();
    }

    if (validateQueryName(newName)) {
      let newComponent = { ...component };
      newComponent.component.name = newName;
      componentDefinitionChanged(newComponent);
    } else {
      toast.error('Invalid widget name. Should be unique and only include letters, numbers and underscore.');
      setInputFocus();
    }
  }

  const getDefaultValue = (val) => {
    if (componentMeta?.definition?.defaults) {
      return componentMeta.definition.defaults.find((el) => el.type === val);
    }
    return null;
  };

  function paramUpdated(param, attr, value, paramType) {
    let newDefinition = { ...component.component.definition };
    let allParams = newDefinition[paramType] || {};
    const paramObject = allParams[param.name];
    if (!paramObject) {
      allParams[param.name] = {};
    }

    if (attr) {
      allParams[param.name][attr] = value;
      const defaultValue = getDefaultValue(value);
      if (param.type === 'select' && defaultValue) {
        allParams[defaultValue.paramName]['value'] = defaultValue.value;
      }
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

      componentDefinitionChanged(newComponent);

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

      case 'FilePicker':
        return (
          <FilePicker
            layoutPropertyChanged={layoutPropertyChanged}
            component={component}
            paramUpdated={paramUpdated}
            dataQueries={dataQueries}
            componentMeta={componentMeta}
            currentState={currentState}
            darkMode={darkMode}
            eventsChanged={eventsChanged}
            apps={apps}
            allComponents={allComponents}
          />
        );

      case 'CustomComponent':
        return (
          <CustomComponent
            layoutPropertyChanged={layoutPropertyChanged}
            component={component}
            paramUpdated={paramUpdated}
            dataQueries={dataQueries}
            componentMeta={componentMeta}
            currentState={currentState}
            darkMode={darkMode}
            eventsChanged={eventsChanged}
            apps={apps}
            allComponents={allComponents}
          />
        );

      default: {
        return (
          <DefaultComponent
            layoutPropertyChanged={layoutPropertyChanged}
            component={component}
            paramUpdated={paramUpdated}
            dataQueries={dataQueries}
            componentMeta={componentMeta}
            currentState={currentState}
            darkMode={darkMode}
            eventsChanged={eventsChanged}
            apps={apps}
            allComponents={allComponents}
          />
        );
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
      <div ref={tabsRef}>
        <Tabs activeKey={key} onSelect={(k) => setKey(k)} className={`tabs-inspector ${darkMode && 'dark'}`}>
          <Tab style={{ marginBottom: 100 }} eventKey="properties" title="Properties">
            <div className="header py-1 row">
              <div>
                <div className="input-icon">
                  <input
                    onChange={(e) => setNewComponentName(e.target.value)}
                    type="text"
                    onKeyUp={(e) => {
                      if (e.keyCode === 13) handleComponentNameChange(newComponentName);
                    }}
                    onBlur={() => handleComponentNameChange(newComponentName)}
                    className="w-100 form-control-plaintext form-control-plaintext-sm mt-1"
                    value={newComponentName}
                    ref={inputRef}
                    data-cy="edit-widget-name"
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
      </div>

      <div
        className="close-icon"
        style={{ backgroundColor: darkMode && '#232e3c', height: darkMode ? tabHeight + 1 : tabHeight }}
      >
        <div className="svg-wrapper">
          <svg
            width="20"
            height="21"
            viewBox="0 0 20 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="close-svg"
            onClick={() => {
              switchSidebarTab(2);
            }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.99931 10.9751L15.0242 16.0014L16 15.027L10.9737 10.0007L16 4.97577L15.0256 4L9.99931 9.0263L4.97439 4L4 4.97577L9.02492 10.0007L4 15.0256L4.97439 16.0014L9.99931 10.9751Z"
              fill="#8092AC"
            />
          </svg>
        </div>
      </div>

      <div className="widget-documentation-link p-2">
        <a
          href={`https://docs.tooljet.io/docs/widgets/${convertToKebabCase(componentMeta?.name ?? '')}`}
          target="_blank"
          rel="noreferrer"
          data-cy="widget-documentation-link"
        >
          <small>{componentMeta.name} documentation</small>
        </a>
      </div>
    </div>
  );
};
