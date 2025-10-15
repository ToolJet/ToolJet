import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { useRef } from 'react';
import { Input } from '../Input';
import { Button } from '../../Button/Button';
import { cn } from '@/lib/utils';
import { inputPaddingVariants, inputPositionVariants, inputIconSizeVariants } from '../InputUtils/Variants';

const Btn = ({ onClick, icon, disabled, className }) => (
  <Button
    iconOnly
    leadingIcon={icon}
    onClick={onClick}
    size="small"
    variant="ghost"
    className={`!tw-h-[50%] tw-rounded-none ${className}`}
    fill={disabled ? 'var(--icon-weak)' : 'var(--icon-default)'}
    disabled={disabled}
  />
);

const NumberInput = ({ size, leadingIcon, disabled, ...restProps }) => {
  const inputRef = useRef(null);

  // Build className using variants for positioning only (size and validationState are handled in Input.jsx)
  const leadingIconPaddingResult = leadingIcon ? inputPaddingVariants({ leadingIconPadding: size }) : 'tw-pl-[12px]';

  const inputClassName = cn(
    // Leading icon padding
    leadingIconPaddingResult
  );

  const handleIncrement = () => {
    if (inputRef.current) {
      const newValue = Number.parseFloat(inputRef.current.value) + 1;
      inputRef.current.value = newValue;
    }
  };

  const handleDecrement = () => {
    if (inputRef.current) {
      const newValue = Number.parseFloat(inputRef.current.value) - 1;
      inputRef.current.value = newValue;
    }
  };

  return (
    <div className="tw-relative">
      {leadingIcon && (
        <SolidIcon
          name={leadingIcon}
          className={cn(
            'tw-absolute',
            inputPositionVariants({ leadingIconPosition: size }),
            inputIconSizeVariants({ iconSize: size })
          )}
          fill="var(--icon-default)"
        />
      )}
      <Input size={size} disabled={disabled} className={inputClassName} ref={inputRef} {...restProps} />
      <div
        className={cn(
          'tw-absolute tw-h-full tw-top-0 tw-right-0 tw-flex tw-flex-col tw-border-l-[1px] tw-border-y-0 tw-border-r-0 tw-border-solid tw-border-l-border-weak'
        )}
      >
        <Btn icon="uparrow" onClick={handleIncrement} disabled={disabled} className="tw-rounded-tr-[8px]" />
        <Btn icon="downarrow" onClick={handleDecrement} disabled={disabled} className="tw-rounded-br-[8px]" />
      </div>
    </div>
  );
};

export default NumberInput;
