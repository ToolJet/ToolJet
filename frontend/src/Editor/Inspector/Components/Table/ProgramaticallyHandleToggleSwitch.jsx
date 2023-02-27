import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export const ProgramaticallyHandleToggleSwitch = ({
  currentState,
  darkMode,
  label,
  index,
  callbackFunction,
  property,
  action = {},
  component,
}) => {
  const param = { name: property };
  const definition = { value: action.disableActionButton, fxActive: action.fxActive };
  const initialValue = definition ? definition.value : '';
  const paramType = 'properties';
  const paramMeta = {
    type: 'toggle',
    displayName: 'Disable action button',
  };
  const options = {};
  return (
    <CodeHinter
      enablePreview={true}
      currentState={currentState}
      initialValue={initialValue}
      mode={options.mode}
      theme={darkMode ? 'monokai' : options.theme}
      lineWrapping={true}
      onChange={(value) => callbackFunction(index, property, value)}
      componentName={`widget/${component.name}::${label}`}
      type={paramMeta.type}
      paramName={param.name}
      paramLabel={paramMeta.displayName}
      fieldMeta={paramMeta}
      onFxPress={(active) => {
        callbackFunction(index, 'fxActive', active);
      }}
      fxActive={action?.fxActive ?? false}
      component={component}
      className="codehinter-default-input"
    />
  );
};
