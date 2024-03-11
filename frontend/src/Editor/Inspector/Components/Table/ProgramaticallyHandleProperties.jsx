import React from 'react';
import { CodeHinter } from '../../../CodeBuilder/CodeHinter';

export const ProgramaticallyHandleProperties = ({
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
      case 'useDynamicOptions':
        return props?.useDynamicOptions;
      case 'makeDefaultOption':
        return props?.[index]?.makeDefaultOption;
      case 'textColor':
        return props?.textColor;
      case 'cellBackgroundColor':
        return props?.cellBackgroundColor;
      case 'isAllColumnsEditable':
        return props?.isAllColumnsEditable;
      default:
        return;
    }
  };

  const getInitialValue = (property, definitionObj) => {
    if (property === 'columnVisibility') {
      return definitionObj?.value ?? `{{true}}`;
    }
    if (property === 'linkTarget') {
      return definitionObj?.value ?? '_blank';
    }
    if (property === 'cellBackgroundColor') {
      return definitionObj?.value ?? '';
    }
    if (property === 'textColor') {
      return definitionObj?.value ?? '#11181C';
    }
    return definitionObj?.value ?? `{{false}}`;
  };

  const value = getValueBasedOnProperty(property, props);
  const param = { name: property === 'makeDefaultOption' ? `options::${property}` : property };
  let definition;
  let initialValue;
  let isFxActive = Array.isArray(props) ? props?.[index]?.fxActive ?? false : props.fxActive ?? false;
  if (Array.isArray(props)) {
    definition = { value, fxActive: props?.[index]?.fxActive };
    initialValue = getInitialValue(property, definition);
  } else {
    definition = { value, fxActive: props.fxActive };
    initialValue = getInitialValue(property, definition);
  }
  const options = {};
  return (
    <div className={`field ${options.className}`} onClick={(e) => e.stopPropagation()}>
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
        fxActive={isFxActive}
        component={component.component}
        className={options.className}
      />
    </div>
  );
};
