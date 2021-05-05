import React from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { Code } from './Elements/Code';
import { Toggle } from './Elements/Toggle';
import { TypeMapping } from './TypeMapping';
import { EventSelector } from './EventSelector';
import { QuerySelector } from './QuerySelector';

const AllElements = {
  Color,
  Json,
  Text,
  Code,
  Toggle
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

export function renderElement(component, componentMeta, paramUpdated, dataQueries, param, paramType, currentState, components = {}) {
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
        />
  );
}

export function renderEvent(component, eventUpdated, dataQueries, eventOptionUpdated, eventName, eventMeta) {
  let definition = component.component.definition.events[eventName];
  definition = definition || { };

  return (
        <EventSelector
            param={{ name: eventName }}
            eventMeta={eventMeta}
            definition={definition}
            eventUpdated={eventUpdated}
            dataQueries={dataQueries}
            eventOptionUpdated={eventOptionUpdated}
        />
  );
}
