import React from 'react';
import { Label } from '../../Label/Label';
import ValidationIcon from './ValidationIcon';
import { cn } from '@/lib/utils';
import HelperIcon from './HelperIcon';
import {generateCypressDataCy} from '../../../../modules/common/helpers/cypressHelpers.js';

export const ValidationMessage = ({ response, validationMessage, className }) => (
  <div className={cn('tw-flex tw-pl-[2px] tw-items-start tw-my-[2px]', className)}>
    <div className="tw-flex tw-pt-[3.5px]">
      <ValidationIcon result={response} />
    </div>
    <Label
      htmlFor="validation"
      type="helper"
      size="default"
      className={`tw-font-normal ${response === true ? 'tw-text-text-success' : '!tw-text-text-warning'}`}
      data-cy={`${generateCypressDataCy(validationMessage)}-validation-label`}
    >
      {validationMessage}
    </Label>
  </div>
);

export const HelperMessage = ({ helperText, className, labelStyle }) => (
  <div className={cn('tw-flex tw-pl-[2px] tw-items-start tw-my-[2px]', className)}>
    <div className="tw-flex tw-pt-[3.5px]">
      <HelperIcon />
    </div>
    <Label
      htmlFor="helper"
      type="helper"
      size="default"
      className={cn('tw-font-normal', labelStyle)}
      data-cy="helper-text"
    >
      {helperText}
    </Label>
  </div>
);

export const RequiredIndicator = ({ disabled }) => (
  <span
    className={`tw-ml-[2px] tw-relative -tw-top-[1px] ${disabled ? 'tw-text-text-disabled' : 'tw-text-text-danger'}`}
    data-cy="required-indicator"
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
    data-cy={`${generateCypressDataCy(label)}-field-label`}
  >
    {label}
    {required && <RequiredIndicator disabled={disabled} />}
  </Label>
);
