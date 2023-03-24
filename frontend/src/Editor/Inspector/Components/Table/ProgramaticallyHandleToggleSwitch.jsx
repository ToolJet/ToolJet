import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export const ProgramaticallyHandleToggleSwitch = ({
  currentState,
  darkMode,
  label,
  index,
  callbackFunction,
  property,
  props = {},
  component,
  paramMeta,
  // eslint-disable-next-line no-unused-vars
  paramType,
}) => {
  const value = property === 'isEditable' ? props.isEditable : props.disableActionButton;
  const param = { name: property };
  const definition = { value, fxActive: props.fxActive };
  const initialValue = definition?.value ?? `{{false}}`;

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
      fxActive={props?.fxActive ?? false}
      component={component}
      className="codehinter-default-input"
    />
  );
};
