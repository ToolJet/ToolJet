import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const BooleanColumn = ({ value = false, isEditable, onChange, toggleOnBg, toggleOffBg }) => {
  const getCustomBgStyles = (value, toggleOnBg, toggleOffBg) => {
    if (value && toggleOnBg) {
      return { backgroundColor: toggleOnBg };
    }
    if (!value && toggleOffBg) {
      return { backgroundColor: toggleOffBg };
    }
    return {};
  };

  const nonEditableContent = (isTruthyValue) =>
    isTruthyValue ? (
      <SolidIcon name="tick" width="24" fill="var(--grass9)" />
    ) : (
      <SolidIcon name="remove" width="24" fill="var(--tomato9)" />
    );

  const editableContent = (isEditable, value, onChange) => (
    <label className="boolean-switch">
      <input type="checkbox" disabled={!isEditable} checked={value} onClick={() => onChange(!value)} />
      <span className="boolean-slider round" style={getCustomBgStyles(value, toggleOnBg, toggleOffBg)} />
    </label>
  );

  return (
    <div className="h-100 d-flex align-items-center w-100" style={{ lineHeight: 1 }}>
      {isEditable ? editableContent(isEditable, value, onChange) : nonEditableContent(value)}
    </div>
  );
};
