import React from 'react';
import { Label } from '../../Label/Label';
import ValidationIcon from './ValidationIcon';
import { cn } from '@/lib/utils';
import HelperIcon from './HelperIcon';

export const ValidationMessage = ({ response, validationMessage, className }) => (
  <div className={cn('tw-flex tw-pl-[2px] tw-items-center tw-my-[2px]', className)}>
    <ValidationIcon result={response} />
    <Label
      htmlFor="validation"
      type="helper"
      size="default"
      className={`tw-font-normal ${response === true ? 'tw-text-text-success' : 'tw-text-text-warning'}`}
    >
      {validationMessage}
    </Label>
  </div>
);

export const HelperMessage = ({ helperText, className, labelStyle }) => (
  <div className={cn('tw-flex tw-pl-[2px] tw-items-center tw-my-[2px]', className)}>
    <HelperIcon />
    <Label htmlFor="helper" type="helper" size="default" className={cn('tw-font-normal', labelStyle)}>
      {helperText}
    </Label>
  </div>
);

export const RequiredIndicator = ({ disabled }) => (
  <span
    className={`tw-ml-[2px] tw-relative -tw-top-[1px] ${disabled ? 'tw-text-text-disabled' : 'tw-text-text-danger'}`}
  >
    *
  </span>
);

export const InputLabel = ({ disabled, label, required }) => (
  <Label
    htmlFor="label"
    type="label"
    size="default"
    className={`tw-font-medium tw-mb-[2px] ${disabled ? 'tw-text-text-disabled' : ''}`}
  >
    {label}
    {required && <RequiredIndicator disabled={disabled} />}
  </Label>
);
