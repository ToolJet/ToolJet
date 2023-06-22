import React from 'react';
import { Code } from './Elements/Code';
import { QuerySelector } from './QuerySelector';

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
  components = {},
  darkMode = false
) {
  const componentDefinition = component.component.definition;
  const paramTypeDefinition = componentDefinition[paramType] || {};
  const definition = paramTypeDefinition[param] || {};

  const meta = componentMeta[paramType][param];
  console.log(darkMode, 'darkMode');
  return (
    <Code
      param={{ name: param, ...component.component.properties[param] }}
      definition={definition}
      dataQueries={dataQueries}
      onChange={paramUpdated}
      paramType={paramType}
      components={components}
      componentMeta={componentMeta}
      darkMode={darkMode}
      componentName={component.component.name || null}
      type={meta.type}
      fxActive={definition.fxActive ?? false}
      onFxPress={(active) => {
        paramUpdated({ name: param, ...component.component.properties[param] }, 'fxActive', active, paramType);
      }}
      component={component}
    />
  );
}
