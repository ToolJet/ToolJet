import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { componentTypes } from '../Components/components';
import { Table } from './Components/Table';
import { Chart } from './Components/Chart';
import { renderElement } from './Utils';
import { toast } from 'react-toastify';
import { validateQueryName, convertToKebabCase } from '@/_helpers/utils';
import { EventManager } from './EventManager';
import useShortcuts from '@/_hooks/use-shortcuts';
import { ConfirmDialog } from '@/_components';
import Accordion from '@/_ui/Accordion';
import { useSpring, animated } from 'react-spring';
import usePopover from '@/_hooks/use-popover';

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
  globalSettings,
  globalSettingsChanged,
}) => {
  const selectedComponent = {
    id: selectedComponentId,
    component: allComponents[selectedComponentId].component,
    layouts: allComponents[selectedComponentId].layouts,
  };
  const [component, setComponent] = useState(selectedComponent);
  const [showWidgetDeleteConfirmation, setWidgetDeleteConfirmation] = useState(false);
  const [components, setComponents] = useState(allComponents);
  const [key, setKey] = React.useState('properties');
  const [open, trigger, content] = usePopover(false);
  const popoverFadeStyle = useSpring({ opacity: open ? 1 : 0 });

  useShortcuts(
    ['Backspace'],
    () => {
      setWidgetDeleteConfirmation(true);
    },
    []
  );

  const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

  useEffect(() => {
    setComponent(selectedComponent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error('Invalid query name. Should be unique and only include letters, numbers and underscore.', {
        hideProgressBar: true,
      });
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

    setComponent(newComponent);
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

      setComponent(newComponent);
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

    setComponent(newComponent);
    componentDefinitionChanged(newComponent);
  }

  function eventsChanged(newEvents) {
    let newDefinition = { ...component.component.definition };
    newDefinition.events = newEvents;

    let newComponent = {
      ...component,
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
      ...component,
    };

    setComponent(newComponent);
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
            components={components}
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
            components={components}
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
              components,
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
                components={components}
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
                components,
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
                components
              )}
              {renderElement(
                component,
                componentMeta,
                layoutPropertyChanged,
                dataQueries,
                'showOnMobile',
                'others',
                currentState,
                components
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
          removeComponent(selectedComponent);
        }}
        onCancel={() => setWidgetDeleteConfirmation(false)}
      />
      <div className="card-header">
        {/* <span className="comment-notification-header">Inspector</span> */}
        <div className="cursor-pointer ms-auto position-relative">
          <svg
            {...trigger}
            xmlns="http://www.w3.org/2000/svg"
            height="18px"
            viewBox="0 0 24 24"
            width="18px"
            fill={darkMode ? '#ffffff' : '#232e3c'}
          >
            <path d="M0 0h24v24H0V0z" fill="none" />
            <path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
          <animated.div
            {...content}
            style={popoverFadeStyle}
            className={cx('card popover global-settings-popover', {
              show: open,
              hide: !open,
            })}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="d-flex mb-3">
                <span>Hide header for launched apps</span>
                <div className="ms-auto form-check form-switch position-relative">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={globalSettings.hideHeader}
                    onChange={(e) => globalSettingsChanged('hideHeader', e.target.checked)}
                  />
                </div>
              </div>
              <div className="d-flex mb-3">
                <span className="w-full">Max width of canvas</span>
                <div className="ms-auto form-check form-switch position-relative">
                  <div className="input-with-icon">
                    <input
                      type="text"
                      className={`form-control form-control-sm`}
                      placeholder={'Enter canvas max-width'}
                      onChange={(e) => {
                        globalSettingsChanged('canvasMaxWidth', e.target.value);
                      }}
                      defaultValue={globalSettings.canvasMaxWidth}
                    />
                    <span className="input-group-text">px</span>
                  </div>
                </div>
              </div>
              <div className="d-flex">
                <span className="w-full">Background color of canvas</span>
                <div>
                  <input
                    type="text"
                    className={`form-control form-control-sm`}
                    placeholder={'Enter canvas background color'}
                    onChange={(e) => {
                      globalSettingsChanged('canvasBackgroundColor', e.target.value);
                    }}
                    defaultValue={globalSettings.canvasBackgroundColor}
                  />
                </div>
              </div>
            </div>
          </animated.div>
        </div>
      </div>

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
                components
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
