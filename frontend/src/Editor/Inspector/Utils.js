import React from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { Code } from './Elements/Code';
import { Select } from './Elements/Select';
import { Toggle } from './Elements/Toggle';
import { AlignButtons } from './Elements/AlignButtons';
import { TypeMapping } from './TypeMapping';
import { QuerySelector } from './QuerySelector';

const AllElements = {
  Color,
  Json,
  Text,
  Code,
  Toggle,
  Select,
  AlignButtons,
};

export function renderQuerySelector(component, dataQueries, eventOptionUpdated, eventName, eventMeta) {
  let definition = component.component.definition.events[eventName];
  definition = definition || {};

  return (
    <QuerySelector
      param={{ name: eventName }}
      definition={definition}
      eventMeta={eventMeta}
      dataQueries={dataQueries}
      eventOptionUpdated={eventOptionUpdated}
    />
  );
}

export function renderElement(
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  param,
  paramType,
  currentState,
  components = {},
  darkMode = false
) {
  const componentDefinition = component.component.definition;
  const paramTypeDefinition = componentDefinition[paramType] || {};
  const definition = paramTypeDefinition[param] || {};

  const meta = componentMeta[paramType][param];

  const ElementToRender = AllElements[TypeMapping[meta.type]];

  return (
    <ElementToRender
      param={{ name: param, ...component.component.properties[param] }}
      definition={definition}
      dataQueries={dataQueries}
      onChange={paramUpdated}
      paramType={paramType}
      components={components}
      componentMeta={componentMeta}
      currentState={currentState}
      darkMode={darkMode}
      componentName={component.component.name || null}
    />
  );
}
