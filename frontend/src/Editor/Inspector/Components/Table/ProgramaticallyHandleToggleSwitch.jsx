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
  const getValueBasedOnProperty = (property, props) => {
    switch (property) {
      case 'isEditable':
        return props.isEditable;

      case 'disableActionButton':
        return props.disableActionButton;

      case 'columnVisibility':
        return props.columnVisibility;
      case 'linkTarget':
        return props.linkTarget;
      default:
        return;
    }
  };
  const getOptionsForSelectElement = (property, paramMeta) => {
    switch (property) {
      case 'linkTarget':
        return {
          ...paramMeta,
          options: [
            { name: 'Same window', value: '_self' },
            { name: 'New window', value: '_blank' },
          ],
        };

      default:
        break;
    }
  };
  if (paramMeta.type === 'select') {
    paramMeta = getOptionsForSelectElement(property, paramMeta);
  }

  const getInitialValue = (property, definition) => {
    if (property === 'columnVisibility') {
      return definition?.value ?? `{{true}}`;
    }
    if (property === 'linkTarget') {
      return definition?.value ?? '_blank';
    }
    return definition?.value ?? `{{false}}`;
  };

  const value = getValueBasedOnProperty(property, props);
  const param = { name: property };
  const definition = { value, fxActive: props.fxActive };
  const initialValue = getInitialValue(property, definition);

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
        componentName={`component/${component?.component?.name}::${param.name}`}
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
