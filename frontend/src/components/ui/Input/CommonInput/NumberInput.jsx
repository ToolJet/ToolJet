import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { useRef } from 'react';
import { Input } from '../Input';
import { Button } from '../../Button/Button';
import { cn } from '@/lib/utils';
import { inputVariants } from '../InputUtils/Variants';

const Btn = ({ onClick, icon, disabled, className }) => (
  <Button
    iconOnly
    leadingIcon={icon}
    onClick={onClick}
    size="small"
    variant="ghost"
    className={`tw-h-[50%] tw-rounded-none ${className}`}
    fill={disabled ? 'var(--icon-weak)' : 'var(--icon-default)'}
    disabled={disabled}
  />
);

const NumberInput = ({ size, leadingIcon, response, disabled, ...restProps }) => {
  const inputRef = useRef(null);

  const inputStyle = `tw-border-border-default placeholder:tw-text-text-placeholder tw-font-normal disabled:tw-bg-[#CCD1D5]/30 tw-pr-[12px] ${
    leadingIcon ? (size === 'small' ? 'tw-pl-[32px]' : 'tw-pl-[34px]') : 'tw-pl-[12px]'
  } ${
    response === true
      ? 'tw-border-border-success-strong focus-visible:!tw-ring-0 focus-visible:!tw-ring-offset-0 focus-visible:!tw-border-border-success-strong'
      : response === false
      ? 'tw-border-border-danger-strong focus-visible:!tw-ring-0 focus-visible:!tw-ring-offset-0 focus-visible:!tw-border-border-success-strong'
      : ''
  }`;

  const handleIncrement = () => {
    if (inputRef.current) {
      let newValue = parseFloat(inputRef.current.value) + 1;
      inputRef.current.value = newValue;
    }
  };

  const handleDecrement = () => {
    if (inputRef.current) {
      let newValue = parseFloat(inputRef.current.value) - 1;
      inputRef.current.value = newValue;
    }
  };

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
        placeholder={'00.00'}
        disabled={disabled}
        className={inputStyle}
        ref={inputRef}
        {...restProps}
      />
      <div
        className={cn(
          inputVariants({ size }),
          'tw-absolute tw-top-0 tw-right-0 tw-flex tw-flex-col tw-border-l-[1px] tw-border-y-0 tw-border-r-0 tw-border-solid tw-border-l-border-weak'
        )}
      >
        <Btn icon="uparrow" onClick={handleIncrement} disabled={disabled} className="tw-rounded-tr-[8px]" />
        <Btn icon="downarrow" onClick={handleDecrement} disabled={disabled} className="tw-rounded-br-[8px]" />
      </div>
    </div>
  );
};

export default NumberInput;
