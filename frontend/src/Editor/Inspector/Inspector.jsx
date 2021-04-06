import React, { useState, useEffect } from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { componentTypes } from '../Components/components';
import { Table } from './Components/Table';
import { renderElement, renderEvent } from './Utils';
import { toast } from 'react-toastify';

const AllElements = { 
    Color,
    Json,
    Text
}

export const Inspector = ({ selectedComponent, componentDefinitionChanged, dataQueries }) => {

    const [component, setComponent] = useState(selectedComponent);
    const componentMeta = componentTypes.find(comp => component.component.component === comp.component);

    console.log('rendering inspector');
    console.log(selectedComponent);

    useEffect(() => {
        setComponent(selectedComponent);
    }, [selectedComponent]);

    function paramUpdated(param, attr, value, paramType) {

        let newDefinition = { ...component.component.definition };

        const paramObject = newDefinition[paramType][param.name];

        if(!paramObject) {
            newDefinition[paramType][param.name] = {}
        }
        newDefinition[paramType][param.name][attr] = value;

        let newComponent = { 
            ...component
        }

        setComponent(newComponent);
        componentDefinitionChanged(newComponent);
    }

    function eventUpdated (event, actionId) {
        
        let newDefinition = { ...component.component.definition };
        newDefinition.events[event.name] = { actionId };

        let newComponent = { 
            ...component
        }

        setComponent(newComponent);
        componentDefinitionChanged(newComponent);
    }

    function eventOptionUpdated (event, option, value) {

        console.log('eventOptionUpdated', event, option, value)
        
        let newDefinition = { ...component.component.definition };
        newDefinition.events[event.name].options = {...newDefinition.events[event.name].options, [option]: value}

        let newComponent = { 
            ...component
        }

        setComponent(newComponent);
        componentDefinitionChanged(newComponent);
    }

    return (
        <div className="inspector">
            <div className="header p-2">
                <span className="component-name">
                    <span className="p-2">{component.component.name}</span>
                    <CopyToClipboard text={`{{components.${component.component.name}}}`}
                        onCopy={() => toast.success('Reference copied to clipboard', { hideProgressBar: true, position: "bottom-center", })}>
                        <img src="https://www.svgrepo.com/show/86790/copy.svg" width="15" height="15" role="button"></img>
                    </CopyToClipboard>
                </span>
                
                <img role="button" className="component-action-button" src="https://www.svgrepo.com/show/46582/menu.svg" width="15" height="15"/>
            </div>

            {componentMeta.component === 'Table' ? 
                <Table 
                    component={component}
                    paramUpdated={paramUpdated}
                    dataQueries={dataQueries}
                    componentMeta={componentMeta}
                    eventUpdated={eventUpdated}
                    eventOptionUpdated={eventOptionUpdated}
                />
            :
                <div className="properties-container p-2">
                    {Object.keys(componentMeta.properties).map((property) => renderElement(component, componentMeta, paramUpdated, dataQueries, property, 'properties'))}
                    {Object.keys(componentMeta.styles).map((style) => renderElement(component, componentMeta, paramUpdated, dataQueries, style, 'styles'))}
                    <hr></hr>
                    {componentMeta.events.map((event) => renderEvent(component, eventUpdated, dataQueries, eventOptionUpdated, event))}
                </div>
            }
        </div>
    );
}
