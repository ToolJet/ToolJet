import React, { useEffect } from 'react';
import { SelectRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/SelectRenderer';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

/**
 * SelectFieldAdapter - KeyValuePair adapter for Select dropdown
 *
 * Uses shared SelectRenderer with KeyValuePair-specific options handling.
 */
export const SelectField = ({
  field,
  value,
  onChange,
  isEditable = false,
  placeholder = 'Select...',
  darkMode = false,
  textColor,
  containerWidth,
  optionsLoadingState = false,
  defaultOptionsList = [],
  isEditing,
  setIsEditing,
  isMulti = false,
  onValidationChange,
}) => {
  const getResolvedValue = useStore.getState().getResolvedValue;
  const validateWidget = useStore((state) => state.validateWidget, shallow);

  // Resolve options
  let options = [];
  let useDynamicOptions = getResolvedValue(field?.useDynamicOptions);
  if (useDynamicOptions) {
    const dynamicOptions = getResolvedValue(field?.dynamicOptions || []);
    options = Array.isArray(dynamicOptions) ? dynamicOptions : [];
  } else {
    options = field?.options ?? [];
    options =
      options?.map((option) => ({
        label: option.label,
        value: option.value,
        optionColor: option.optionColor,
        labelColor: option.labelColor,
      })) ?? [];
  }

  // Validation
  const validationData = validateWidget({
    validationObject: {
      customRule: { value: field?.customRule },
    },
    widgetValue: value,
    customResolveObjects: { value },
  });
  const { isValid, validationError } = validationData;

  // Expose validation state to parent
  useEffect(() => {
    onValidationChange?.({ isValid, validationError });
  }, [isValid, validationError, onValidationChange]);

  return (
    <SelectRenderer
      options={options}
      value={value}
      search={true}
      onChange={onChange}
      fuzzySearch
      placeholder={placeholder}
      disabled={!isEditable}
      className="select-search table-select-search"
      darkMode={darkMode}
      defaultOptionsList={defaultOptionsList}
      textColor={textColor}
      isMulti={isMulti}
      containerWidth={containerWidth}
      optionsLoadingState={field?.optionsLoadingState}
      isEditable={isEditable}
      widgetType="KeyValuePair"
      isFocused={isEditing}
      setIsFocused={setIsEditing}
      autoAssignColors={field?.autoAssignColors}
      isValid={isValid}
      validationError={validationError}
    />
  );
};

export default SelectField;
