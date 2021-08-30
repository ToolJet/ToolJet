import React from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { Code } from './Elements/Code';
import { Select } from './Elements/Select';
import { Toggle } from './Elements/Toggle';
import { TypeMapping } from './TypeMapping';
import { QuerySelector } from './QuerySelector';

const AllElements = {
  Color,
  Json,
  Text,
  Code,
  Toggle,
  Select
};

export function renderQuerySelector(component, dataQueries, eventOptionUpdated, eventName, eventMeta) {
  let definition = component.component.definition.events[eventName];
  definition = definition || { };

  return (<QuerySelector
    param={{ name: eventName }}
    definition={definition}
    eventMeta={eventMeta}
    dataQueries={dataQueries}
    eventOptionUpdated={eventOptionUpdated}
  />)
}

export function renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState, components = {}, darkMode = false) {
  const definition = component.component.definition[paramType][param];
  const meta = componentMeta[paramType][param];
  console.log('definition', definition);

  const ElementToRender = AllElements[TypeMapping[meta.type]];

  return (<ElementToRender
            param={{ name: param, ...component.component.properties[param] }}
            definition={definition}
            dataQueries={dataQueries}
            onChange={paramUpdated}
            paramType={paramType}
            components={components}
            componentMeta={componentMeta}
            currentState={currentState}
            darkMode={darkMode}
        />
  );
}
