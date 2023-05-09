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
  const getValueBasedOnProperty = (property, props) => {
    let value = undefined;
    switch (property) {
      case 'isEditable':
        value = props.isEditable;
        break;
      case 'disableActionButton':
        value = props.disableActionButton;
        break;
      case 'columnVisibility':
        value = props.columnVisibility;
        break;
      default:
        break;
    }
    return value;
  };

  const getInitialValue = (property, definition) => {
    if (property === 'columnVisibility') {
      return definition?.value ?? `{{true}}`;
    } else {
      return definition?.value ?? `{{false}}`;
    }
  };

  const value = getValueBasedOnProperty(property, props);
  const param = { name: property };
  const definition = { value, fxActive: props.fxActive };
  const initialValue = getInitialValue(property, definition);

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
