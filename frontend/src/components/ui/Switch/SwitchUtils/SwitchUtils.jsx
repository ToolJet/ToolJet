import React from 'react';
import { Label } from '../../Label/Label';

export const SwitchLabel = ({ label, size, disabled }) => {
  return (
    <Label
      htmlFor="label"
      type="label"
      size={size || 'default'}
      className={`tw-font-normal ${disabled && '!tw-text-text-disabled'}`}
    >
      {label}
    </Label>
  );
};

export const HelperText = ({ helper, size, disabled }) => {
  return (
    <Label
      htmlFor="helper"
      type="helper"
      size={size || 'default'}
      className={`tw-font-normal ${disabled && '!tw-text-text-disabled'}`}
    >
      {helper}
    </Label>
  );
};
