import React from 'react';

import { cn } from '@/lib/utils';

import { Label } from '../../Label/Label';

export const CheckboxLabel = ({ className, label, size, disabled }) => {
  return (
    <Label
      htmlFor="label"
      type="label"
      size={size || 'default'}
      className={cn('tw-font-normal', className, { '!tw-text-text-disabled': disabled })}
    >
      {label}
    </Label>
  );
};

export const HelperText = ({ className, helper, size, disabled }) => {
  return (
    <Label
      htmlFor="helper"
      type="helper"
      size={size || 'default'}
      className={cn('tw-font-normal', className, { '!tw-text-text-disabled': disabled })}
    >
      {helper}
    </Label>
  );
};
