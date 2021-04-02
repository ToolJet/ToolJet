import React, { useState, useEffect } from 'react';
import { Text } from './Elements/Text';

export const Inspector = ({ selectedComponent, componentDefinitionChanged }) => {

    const [component, setComponent] = useState(selectedComponent);

    console.log('rendering inspector');
    console.log(selectedComponent);

    useEffect(() => {
        setComponent(selectedComponent);
    }, [selectedComponent]);

    function paramUpdated (param, attr, value, paramType) {

        let newDefinition = { ...component.component.definition };
        newDefinition[paramType][param.name][attr] = value;

        let newComponent = { 
            ...component
        }

        setComponent(newComponent);

        componentDefinitionChanged(newComponent);
    }

    function renderElement(param, paramType) {

        const definition = component.component.definition[paramType][param];
        console.log('definition', definition);

        return (<Text 
                param={{name: param, ...component.component.properties[param]}} 
                definition={definition}
                onChange={paramUpdated}
                paramType={paramType}
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
                {Object.keys(component.component.properties).map((property) => renderElement(property, 'properties'))}
                {Object.keys(component.component.styles).map((style) => renderElement(style, 'styles'))}
            </div>
        </div>
    );
}
