import React from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { Code } from './Elements/Code';
import { TypeMapping } from './TypeMapping';
import { EventSelector } from './EventSelector';

const AllElements = {
  Color,
  Json,
  Text,
  Code
};

export function renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, components = {}) {
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
        />
  );
}

export function renderEvent(component, eventUpdated, dataQueries, eventOptionUpdated, param) {
  let definition = component.component.definition.events[param];
  definition = definition || { };

  return (
        <EventSelector
            param={{ name: param, ...component.component.properties[param] }}
            definition={definition}
            eventUpdated={eventUpdated}
            dataQueries={dataQueries}
            eventOptionUpdated={eventOptionUpdated}
        />
  );
}
