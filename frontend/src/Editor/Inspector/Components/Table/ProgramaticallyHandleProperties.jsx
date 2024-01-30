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
  console.log('ashok ::', { props });
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

  const getInitialValue = (property, definitionObj) => {
    if (property === 'columnVisibility') {
      return definitionObj?.value ?? `{{true}}`;
    }
    if (property === 'linkTarget') {
      return definitionObj?.value ?? '_blank';
    }
    return definitionObj?.value ?? `{{false}}`;
  };

  const value = getValueBasedOnProperty(property, props);
  const param = { name: property };
  const definition = { value, fxActive: props.fxActive };
  const initialValue = getInitialValue(property, definition);

  const options = {};

  const calcFxActiveState = (props, property) => {
    const fxActiveFieldsPresent = props?.hasOwnProperty('fxActiveFields');
    if (!fxActiveFieldsPresent) {
      return props?.fxActive ?? false;
    }
    const fxActiveFields = props.fxActiveFields;
    const propertyPresentInFxActiveFields = fxActiveFields.length >= 1 && fxActiveFields.includes(property);
    return propertyPresentInFxActiveFields;
  };

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
          const fxActiveFieldsPropExists = props?.hasOwnProperty('fxActiveFields');
          //to support backward compatibility, when fxActive is true for a particular column, we are passing all possible combinations which should render codehinter
          const fxActive = props?.fxActive ? ['isEditable', 'columnVisibility', 'linkTarget'] : [];
          const fxActiveFields = fxActiveFieldsPropExists ? props.fxActiveFields : fxActive;

          const findIndexOfPropertyInFxActiveFields = (property, fxActiveFields) => {
            const index = fxActiveFields.findIndex((prop) => prop === property);
            return index;
          };

          const indexOfProp = findIndexOfPropertyInFxActiveFields(property, fxActiveFields);

          if (active) {
            indexOfProp === -1 && fxActiveFields.push(property);
          } else {
            indexOfProp !== -1 && fxActiveFields.splice(indexOfProp, 1);
          }
          callbackFunction(index, 'fxActiveFields', fxActiveFields);
        }}
        fxActive={calcFxActiveState(props, property)}
        component={component.component}
        className={options.className}
      />
    </div>
  );
};
