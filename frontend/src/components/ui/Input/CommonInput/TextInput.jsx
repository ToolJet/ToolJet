import SolidIcon from '@/_ui/Icon/SolidIcons';
import React from 'react';
import TrailingBtn from '../InputUtils/TrailingBtn';
import { Input } from '../Input';

const TextInput = ({
  size,
  leadingIcon,
  trailingAction,
  trailingActionDisabled,
  response,
  disabled,
  placeholder,
  readOnly,
  ...restProps
}) => {
  const inputStyle = `tw-border-border-default placeholder:tw-text-text-placeholder tw-font-normal disabled:tw-bg-[#CCD1D5]/30 ${
    leadingIcon ? (size === 'small' ? 'tw-pl-[32px]' : 'tw-pl-[34px]') : 'tw-pl-[12px]'
  } ${trailingAction ? (size === 'small' ? 'tw-pr-[40px]' : 'tw-pr-[44px]') : 'tw-pr-[12px]'} ${
    response === true
      ? '!tw-border-border-success-strong focus-visible:!tw-ring-0 focus-visible:!tw-ring-offset-0 focus-visible:!tw-border-border-success-strong'
      : response === false
      ? '!tw-border-border-danger-strong focus-visible:!tw-ring-0 focus-visible:!tw-ring-offset-0 focus-visible:!tw-border-border-danger-strong'
      : ''
  }`;

  return (
    <div className="tw-relative">
      {leadingIcon && (
        <SolidIcon
          name={leadingIcon}
          width="16px"
          height="16px"
          className={`tw-absolute ${size === 'small' ? 'tw-top-[6px] tw-left-[10px]' : 'tw-top-[7px] tw-left-[12px]'}`}
          fill="var(--icon-default)"
        />
      )}
      <Input
        size={size}
        placeholder={disabled && readOnly ? readOnly : placeholder}
        disabled={disabled}
        {...restProps}
        className={inputStyle}
      />
      {trailingAction && (
        <TrailingBtn
          size={size}
          type={trailingAction}
          disabled={trailingActionDisabled || disabled}
          className={`tw-absolute tw-right-[5px] ${size === 'small' ? 'tw-top-[5px]' : 'tw-top-[4px]'}`}
        />
      )}
    </div>
  );
};

export default TextInput;
