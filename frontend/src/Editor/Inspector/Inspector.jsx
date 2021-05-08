import React, { useState, useEffect } from 'react';
import { componentTypes } from '../Components/components';
import { Table } from './Components/Table';
import { renderElement, renderEvent } from './Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import ReactTooltip from 'react-tooltip';
import { toast } from 'react-toastify';
import { validateQueryName } from '@/_helpers/utils';

export const Inspector = ({
  selectedComponent,
  componentDefinitionChanged,
  dataQueries,
  removeComponent,
  components,
  componentChanged,
  currentState
}) => {
  const [component, setComponent] = useState(selectedComponent);
  const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

  useEffect(() => {
    setComponent(selectedComponent);
  }, [selectedComponent]);

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

    const paramObject = newDefinition[paramType][param.name];

    if (!paramObject) {
      newDefinition[paramType][param.name] = {};
    }

    if(attr) {
      newDefinition[paramType][param.name][attr] = value;
    } else {
      newDefinition[paramType][param.name] = value;
    }

    let newComponent = {
      ...component
    };

    setComponent(newComponent);
    componentDefinitionChanged(newComponent);
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
    <ReactTooltip type="dark" effect="solid" place="left" eventOff="click" />
      <div className="header p-2 row">
        <div className="col-auto">
            <div className="input-icon">
                <input
                    type="text"
                    onChange={(e) => handleComponentNameChange(e.target.value)}
                    className="form-control-plaintext form-control-plaintext-sm mt-1"
                    value={component.component.name}
                />
                <span className="input-icon-addon">
                    <img src="https://www.svgrepo.com/show/149235/edit.svg" width="12" height="12" />
                </span>
            </div>
        </div>
        <div className="col pt-2">
            <OverlayTrigger
            trigger="click"
            placement="left"
            overlay={
                <Popover id="popover-basic">
                {/* <Popover.Title as="h3">brrr</Popover.Title> */}
                <Popover.Content>
                    <div className="field mb-2">
                    <button className="btn btn-light btn-sm mb-2">Duplicate</button>
                    <br></br>
                    <button className="btn btn-danger btn-sm" onClick={() => removeComponent(component)}>
                        Remove
                    </button>
                    </div>
                </Popover.Content>
                </Popover>
            }
            >
            <img
                role="button"
                className="component-action-button"
                src="https://www.svgrepo.com/show/46582/menu.svg"
                width="15"
                height="15"
            />
            </OverlayTrigger>
        </div>

      </div>

      {componentMeta.component === 'Table' ? (
        <Table
          component={component}
          paramUpdated={paramUpdated}
          dataQueries={dataQueries}
          componentMeta={componentMeta}
          eventUpdated={eventUpdated}
          eventOptionUpdated={eventOptionUpdated}
          components={components}
          currentState={currentState}
        />
      ) : (
        <div className="properties-container p-2">
          {Object.keys(componentMeta.properties).map((property) => renderElement(component, componentMeta, paramUpdated, dataQueries, property, 'properties', currentState, components))}
          {Object.keys(componentMeta.styles).map((style) => renderElement(component, componentMeta, paramUpdated, dataQueries, style, 'styles', currentState, components))}
          <hr></hr>
          {Object.keys(componentMeta.events).map((eventName) => renderEvent(component, eventUpdated, dataQueries, eventOptionUpdated, eventName, componentMeta.events[eventName], currentState))}
        </div>
      )}
    </div>
  );
};
