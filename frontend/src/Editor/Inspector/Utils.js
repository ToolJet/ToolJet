import React, { useState } from 'react';
import { Text } from './Elements/Text';
import { Color } from './Elements/Color';
import { Json } from './Elements/Json';
import { Code } from './Elements/Code';
import { Select } from './Elements/Select';
import { Toggle } from './Elements/Toggle';
import { AlignButtons } from './Elements/AlignButtons';
import { TypeMapping } from './TypeMapping';
import { QuerySelector } from './QuerySelector';
import { resolveReferences } from '@/_helpers/utils';

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

  const meta = componentMeta[paramType][param];

  return (() => {
    const [codable, setCodable] = useState(meta.type === 'code');
    const ElementToRender = codable ? Code : AllElements[TypeMapping[meta.type]];
    const definition =
      (ElementToRender === Code
        ? paramTypeDefinition[param]
        : resolveReferences(paramTypeDefinition[param], currentState)) || {};
    return (
      <div className="row">
        <div className="col-10">
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
        </div>
        <div className={`col-2 d-flex flex-columns align-items-center ${meta.type === 'code' ? 'd-none' : ''}`}>
          <div className={`fx ${ElementToRender === Code ? 'active' : ''}`} onClick={() => setCodable(!codable)}>
            fx
          </div>
        </div>
      </div>
    );
  })();
}
