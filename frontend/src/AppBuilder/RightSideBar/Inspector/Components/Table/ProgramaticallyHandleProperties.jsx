import { resolveReferences } from '@/_helpers/utils';
import React from 'react';
import CodeHinter from '@/AppBuilder/CodeEditor';

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
      case 'isAllColumnsEditable':
        return props?.isAllColumnsEditable;
      case 'underlineColor':
        return props.underlineColor;
      case 'linkColor':
        return props.linkColor;
      case 'useDynamicOptions':
        return props?.useDynamicOptions;
      case 'autoAssignColors':
        return props?.autoAssignColors;
      case 'makeDefaultOption':
        return props?.[index]?.makeDefaultOption;
      case 'textColor':
        return props?.textColor;
      case 'cellBackgroundColor':
        return props?.cellBackgroundColor;
      case 'optionsLoadingState':
        return props?.optionsLoadingState;
      case 'isTimeChecked':
        return props?.isTimeChecked;
      case 'isTwentyFourHrFormatEnabled':
        return props?.isTwentyFourHrFormatEnabled;
      case 'parseInUnixTimestamp':
        return props?.parseInUnixTimestamp;
      case 'isDateSelectionEnabled':
        return props?.isDateSelectionEnabled;
      case 'jsonIndentation':
        return props?.jsonIndentation;
      case 'labelColor':
        return props?.labelColor;
      case 'optionColor':
        return props?.optionColor;
      default:
        return;
    }
  };

  const getInitialValue = (property, definitionObj) => {
    if (property === 'columnVisibility') {
      return definitionObj?.value ?? `{{true}}`;
    }
    if (property === 'linkTarget') {
      const value = definitionObj?.value;
      if (value === '_self' || value === '{{false}}' || value === '') {
        return '{{false}}';
      }
      return value || '{{true}}';
    }
    if (property === 'cellBackgroundColor') {
      return definitionObj?.value ?? '';
    }
    if (property === 'textColor') {
      return definitionObj?.value ?? '#11181C';
    }
    if (property === 'labelColor') {
      // return definitionObj?.value ?? 'var(--cc-primary-text)';
      return definitionObj?.value ?? '#1B1F24';
    }
    if (property === 'optionColor') {
      // return definitionObj?.value ?? 'var(--cc-surface2-surface)';
      return definitionObj?.value ?? '#E4E7EB';
    }
    if (property === 'underlineColor') {
      return definitionObj?.value ?? '#4368E3';
    }
    if (property === 'underline') {
      return definitionObj?.value ?? 'hover';
    }
    if (property === 'linkColor') {
      return definitionObj?.value ?? '#1B1F24';
    }
    if (property === 'jsonIndentation') {
      return definitionObj?.value ?? `{{true}}`;
    }
    return definitionObj?.value ?? `{{false}}`;
  };

  const value = getValueBasedOnProperty(property, props);
  const param = { name: property === 'makeDefaultOption' ? `options::${property}` : property };
  let definition;
  let initialValue;
  if (Array.isArray(props)) {
    definition = { value, fxActive: props?.[index]?.fxActive };
    initialValue = getInitialValue(property, definition);
  } else {
    definition = { value, fxActive: props.fxActive };
    initialValue = getInitialValue(property, definition);
  }
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
      props?.fxActive && resolveReferences(props.fxActive)
        ? ['isEditable', 'columnVisibility', 'jsonIndentation', 'linkTarget']
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
    <div className={`field ${options.className}`} onClick={(e) => e.stopPropagation()}>
      <CodeHinter
        type="fxEditor"
        initialValue={initialValue}
        onChange={(value) => callbackFunction(index, property, value)}
        componentName={`component/${component?.component?.name}::${param.name}`}
        paramType={paramMeta.type}
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
