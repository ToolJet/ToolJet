import React, { useCallback, useState } from 'react';
import { TagsRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/TagsRenderer';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { isArray } from 'lodash';
import useTextColor from '../_hooks/useTextColor';

export const TagsV2Column = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  darkMode,
  defaultOptionsList = [],
  textColor = '',
  allowMultipleSelection = true,
  sortTags = 'none',
  optionsLoadingState = false,
  horizontalAlignment = 'left',
  isEditable,
  column,
  isNewRow,
  autoAssignColors = true,
  id,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const validateWidget = useStore((state) => state.validateWidget, shallow);
  const cellTextColor = useTextColor(id, textColor);

  const validationData = validateWidget({
    validationObject: {
      customRule: { value: column?.customRule },
    },
    widgetValue: value,
    customResolveObjects: { value },
  });
  const { isValid, validationError } = validationData;

  const handleChange = useCallback(
    (newValue) => {
      if (allowMultipleSelection) {
        const arr = isArray(newValue) ? newValue : [];
        onChange(arr.map((v) => (v && typeof v === 'object' ? v.value : v)));
      } else {
        if (newValue == null || newValue === '') {
          onChange([]);
          return;
        }
        const v = typeof newValue === 'object' ? newValue.value : newValue;
        onChange([v]);
      }
    },
    [allowMultipleSelection, onChange]
  );

  return (
    <TagsRenderer
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      darkMode={darkMode}
      defaultOptionsList={defaultOptionsList}
      textColor={cellTextColor}
      isMulti={allowMultipleSelection}
      optionsLoadingState={optionsLoadingState}
      horizontalAlignment={horizontalAlignment}
      isEditable={isEditable}
      isNewRow={isNewRow}
      autoAssignColors={autoAssignColors}
      isFocused={isFocused}
      setIsFocused={setIsFocused}
      isValid={isValid}
      validationError={validationError}
      menuIsOpen={isFocused || undefined}
      sortTags={sortTags}
    />
  );
};
