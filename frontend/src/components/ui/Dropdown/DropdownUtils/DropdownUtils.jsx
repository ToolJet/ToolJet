import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';
import { Avatar, AvatarFallback, AvatarImage } from '../../Avatar/avatar';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { cn } from '@/lib/utils';
import ValidationIcon from './ValidationIcon';
import { Label } from '../../Label/Label';
import HelperIcon from './HelperIcon';

export const dropdownVariants = cva('', {
  variants: {
    size: {
      small: `tw-h-[28px] tw-px-[10px] tw-py-[6px]`,
      medium: `tw-h-[32px] tw-px-[12px] tw-py-[7px]`,
      large: `tw-h-[40px] tw-px-[12px] tw-py-[7px]`,
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});

export const LeadingIcon = (props) => (
  <div
    className={cn(
      `tw-flex tw-h-[18px] ${props.avatarSrc ? 'tw-w-[20px]' : 'tw-w-[16px]'} tw-items-center tw-justify-center`,
      props.className
    )}
  >
    {props.avatarSrc ? (
      <Avatar>
        <AvatarImage src={props.avatarSrc} alt={props.avatarAlt} />
        <AvatarFallback>{props.avatarFall}</AvatarFallback>
      </Avatar>
    ) : (
      <SolidIcon name="user" height="16px" width="16px" fill="var(--icon-default)" />
    )}
  </div>
);

export const TrailingAction = ({ trailingAction }) => (
  <div className="tw-absolute tw-right-[8px] tw-flex tw-h-[18px] tw-w-[16px] tw-items-center tw-justify-center">
    {trailingAction === 'icon' && <SolidIcon name="arrowright" height="16px" width="16px" fill="var(--icon-default)" />}
    {trailingAction === 'counter' && <Badge>20</Badge>}
  </div>
);

export const DropdownArrowIcon = ({ open, disabled, isHovered }) => {
  return open ? (
    <SolidIcon
      name="TriangleDownCenter"
      height="16px"
      width="16px"
      fill={disabled ? 'var(--icon-weak)' : isHovered ? 'var(--icon-strong)' : 'var(--icon-default)'}
    />
  ) : (
    <SolidIcon
      name="TriangleUpCenter"
      height="16px"
      width="16px"
      fill={disabled ? 'var(--icon-weak)' : isHovered ? 'var(--icon-strong)' : 'var(--icon-default)'}
    />
  );
};

export const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M21.4343 4.34874C22.0935 4.88814 22.1907 5.8599 21.6513 6.51919L11.1442 19.4983C9.55779 21.6237 8.03757 21.0148 6.7253 19.8665L2.52674 16.1928C1.88567 15.6318 1.8207 14.6574 2.38165 14.0163C2.94259 13.3752 3.91702 13.3103 4.5581 13.8712L8.75665 17.545L19.2639 4.56578C19.8032 3.90648 20.7749 3.80931 21.4343 4.34874Z"
      fill="var(--icon-accent)"
    />
  </svg>
);

export const Badge = ({ children }) => (
  <div className="tw-flex tw-items-center tw-justify-center tw-px-[6px] tw-rounded-full tw-bg-[#CCD1D5]/30 tw-text-[11px]/[16px] tw-font-medium tw-text-text-placeholder">
    {children}
  </div>
);

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

export const DropdownLabel = ({ disabled, label, required }) => (
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
