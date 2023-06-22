import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export const ProgramaticallyHandleToggleSwitch = ({
  darkMode,
  // eslint-disable-next-line no-unused-vars
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
    <div className={`mb-2 field ${options.className}`} onClick={(e) => e.stopPropagation()}>
      <CodeHinter
        enablePreview={true}
        initialValue={initialValue}
        mode={options.mode}
        theme={darkMode ? 'monokai' : options.theme}
        lineWrapping={true}
        onChange={(value) => callbackFunction(index, property, value)}
        componentName={`widget/${component?.component?.name}::${param.name}`}
        type={paramMeta.type}
        paramName={param.name}
        paramLabel={paramMeta.displayName}
        fieldMeta={paramMeta}
        onFxPress={(active) => {
          callbackFunction(index, 'fxActive', active);
        }}
        fxActive={props?.fxActive ?? false}
        component={component.component}
        className={options.className}
      />
    </div>
  );
};
