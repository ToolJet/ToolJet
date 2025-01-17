import React from 'react';
import { CustomDropdown } from './CustomDropdown';

export const TagsColumn = ({
  options,
  value,
  multiple,
  onChange,
  darkMode,
  isEditable,
  width,
  contentWrap,
  autoHeight,
  horizontalAlignment,
}) => {
  return (
    <div className={`h-100 w-100 d-flex align-items-center justify-content-${horizontalAlignment}`}>
      <CustomDropdown
        options={options}
        value={value}
        multiple={multiple}
        onChange={onChange}
        darkMode={darkMode}
        isEditable={isEditable}
        width={width}
        contentWrap={contentWrap}
        autoHeight={autoHeight}
      />
    </div>
  );
};
