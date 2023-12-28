import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const Boolean = ({ value = false, isEditable, onChange, toggleOnBg, toggleOffBg }) => {
  const nonEditableContent = (isTruthyValue) => {
    return isTruthyValue ? (
      <SolidIcon name="tick" width="24" fill={`var(--grass9)`} />
    ) : (
      <SolidIcon name="remove" width="24" fill={`var(--tomato9)`} />
    );
  };

  const getCustomBgStyles = (value, toggleOnBg, toggleOffBg) => {
    if (value && toggleOnBg) {
      return { backgroundColor: toggleOnBg };
    }
    if (!value && toggleOffBg) {
      return { backgroundColor: toggleOffBg };
    }
    return {};
  };

  const editableContent = (isEditable, value, onChange) => {
    return (
      <label class="boolean-switch">
        <input
          type="checkbox"
          disabled={!isEditable}
          checked={value}
          onClick={() => {
            onChange(!value);
          }}
        />
        <span class="boolean-slider round" style={getCustomBgStyles(value, toggleOnBg, toggleOffBg)}></span>
      </label>
    );
  };

  return (
    <div className="w-100" style={{ lineHeight: 1 }}>
      {isEditable ? editableContent(isEditable, value, onChange) : nonEditableContent(value)}
    </div>
  );
};
