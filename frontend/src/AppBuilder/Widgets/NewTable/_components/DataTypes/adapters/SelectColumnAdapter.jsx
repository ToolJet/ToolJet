import React, { useState } from 'react';
import { SelectRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/SelectRenderer';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import useTextColor from '../../DataTypes/_hooks/useTextColor';

/**
 * SelectColumnAdapter - Table adapter for SelectRenderer
 *
 * Wraps the shared SelectRenderer with Table-specific validation and styling hooks.
 */
export const CustomSelectColumn = ({
  options,
  value,
  onChange,
  fuzzySearch = false,
  placeholder,
  disabled,
  className,
  darkMode,
  defaultOptionsList = [],
  textColor = '',
  isMulti,
  containerWidth,
  optionsLoadingState = false,
  horizontalAlignment = 'left',
  isEditable,
  column,
  isNewRow,
  autoAssignColors = false,
  id,

  widgetType,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Table-specific hooks
  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const cellTextColor = useTextColor(id, textColor);
  console.log(column, 'column');
  // Validation
  const validationData = validateWidget({
    validationObject: {
      customRule: { value: column?.customRule },
    },
    widgetValue: value,
    customResolveObjects: { value },
  });
  const { isValid, validationError } = validationData;

  return (
    <SelectRenderer
      options={options}
      value={value}
      onChange={onChange}
      fuzzySearch={fuzzySearch}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      darkMode={darkMode}
      defaultOptionsList={defaultOptionsList}
      textColor={cellTextColor}
      isMulti={isMulti}
      containerWidth={containerWidth}
      optionsLoadingState={optionsLoadingState}
      horizontalAlignment={horizontalAlignment}
      isEditable={isEditable}
      isNewRow={isNewRow}
      autoAssignColors={autoAssignColors}
      // isFocused={isFocused}
      // setIsFocused={setIsFocused}
      widgetType={widgetType}
      isValid={isValid}
      validationError={validationError}
    />
  );
};
