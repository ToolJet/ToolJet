import { resolveReferences } from '@/_helpers/utils';
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
  currentState,
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

  const calculateFxActiveFields = (active, props, property) => {
    const fxActiveFieldsPropExists = props?.hasOwnProperty('fxActiveFields') ?? false;
    //to support backward compatibility, when fxActive is true for a particular column, we are passing all possible combinations which should render codehinter
    const fxActive =
      props?.fxActive && resolveReferences(props.fxActive, currentState)
        ? ['isEditable', 'columnVisibility', 'linkTarget']
        : [];

    const checkFxActiveFieldIsArrray = (fxActiveFieldsProperty) => {
      // adding error handling mechanism for fxActiveFieldsProperty , if props.fxActiveFields is array , then return props.fxActiveFields or else return [], this will make sure, fxActiveFields wil always be array
      return Array.isArray(fxActiveFieldsProperty) ? fxActiveFieldsProperty : [];
    };

    const fxActiveFields = fxActiveFieldsPropExists ? checkFxActiveFieldIsArrray(props.fxActiveFields) : fxActive;

    const findIndexOfPropertyInFxActiveFields = (property, fxActiveFields) => {
      // checking if particular property is already present in the fxActiveFields or not
      const index = fxActiveFields.findIndex((prop) => prop === property);
      return index;
    };

    const indexOfProp = findIndexOfPropertyInFxActiveFields(property, fxActiveFields);

    // removing or addding property for which we want to render codehinter
    if (active && indexOfProp === -1) {
      //if active is true and property does not present in the fxActiveField before hand, if both conditions are satisfied, we add it to the array of fxActiveField.
      fxActiveFields.push(property);
    } else if (!active && indexOfProp !== -1) {
      // if active is falsy and particular property is present in the fxActiveField , we remove that particular property from the array
      fxActiveFields.splice(indexOfProp, 1);
    }

    return fxActiveFields;
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
          const resultFxActiveFields = calculateFxActiveFields(active, props, property);
          callbackFunction(index, 'fxActiveFields', resultFxActiveFields);
        }}
        fxActive={calcFxActiveState(props, property)}
        component={component.component}
        className={options.className}
      />
    </div>
  );
};
