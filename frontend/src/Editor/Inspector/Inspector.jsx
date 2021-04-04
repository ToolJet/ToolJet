import React, { useState, useEffect } from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { TypeMapping } from './TypeMapping';
import { EventSelector } from './EventSelector';
import { componentTypes } from '../Components/components';

const AllElements = { 
    Color,
    Json,
    Text
}

export const Inspector = ({ selectedComponent, componentDefinitionChanged, dataQueries }) => {

    const [component, setComponent] = useState(selectedComponent);

    const componentMeta = componentTypes.find(comp => component.component.name === comp.component);

    console.log('rendering inspector');
    console.log(selectedComponent);

    useEffect(() => {
        setComponent(selectedComponent);
    }, [selectedComponent]);

    function paramUpdated (param, attr, value, paramType) {

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

    function renderElement(param, paramType) {

        const definition = component.component.definition[paramType][param];
        const meta = componentMeta[paramType][param];
        console.log('definition', definition);

        const ElementToRender = AllElements[TypeMapping[meta.type]];

        return (<ElementToRender 
                param={{name: param, ...component.component.properties[param]}} 
                definition={definition}
                dataQueries={dataQueries}
                onChange={paramUpdated}
                paramType={paramType}
            />
        )
    }

    function renderEvent(param) {
        const definition = component.component.definition.events[param];

        return (<EventSelector 
            param={{name: param, ...component.component.properties[param]}} 
            definition={definition}
            eventUpdated={eventUpdated}
            dataQueries={dataQueries}
            eventOptionUpdated={eventOptionUpdated}
        />
    )
    }

    return (
        <div className="inspector">
            <div className="header p-2">
                <span className="component-name">
                    {component.component.name}
                </span>
                <img role="button" className="component-action-button" src="https://www.svgrepo.com/show/46582/menu.svg" width="15" height="15"/>
            </div>

            <div className="properties-container p-2">
                {Object.keys(componentMeta.properties).map((property) => renderElement(property, 'properties'))}
                {Object.keys(componentMeta.styles).map((style) => renderElement(style, 'styles'))}
                <hr></hr>
                {componentMeta.events.map((event) => renderEvent(event))}
            </div>
        </div>
    );
}
