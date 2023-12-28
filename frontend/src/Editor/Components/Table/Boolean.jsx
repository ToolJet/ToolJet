import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const Boolean = ({ value = false, isEditable, onChange }) => {
  const nonEditableContent = (isTruthyValue) => {
    return isTruthyValue ? (
      <SolidIcon name="tick" width="24" fill={`var(--grass9)`} />
    ) : (
      <SolidIcon name="remove" width="24" fill={`var(--tomato9)`} />
    );
  };

  const editableContent = (isEditable, value, onChange) => {
    return (
      <label class="boolean-switch">
        <input type="checkbox" disabled={!isEditable} checked={value} onClick={() => onChange(!value)} />
        <span class="boolean-slider round"></span>
      </label>
    );
  };
  return (
    <div className="w-100 d-flex align-items-center">
      {isEditable ? editableContent(isEditable, value, onChange) : nonEditableContent(value)}
    </div>
  );
};
