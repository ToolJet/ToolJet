import { cn } from '@/lib/utils';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import React from 'react';
import TrailingBtn from '../InputUtils/TrailingBtn';
import { Input } from '../Input';
import { inputPositionVariants, inputPaddingVariants, inputIconSizeVariants } from '../InputUtils/Variants';

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
  // Build className using variants for positioning only (size and validationState are handled in Input.jsx)
  const leadingIconPaddingResult = leadingIcon ? inputPaddingVariants({ leadingIconPadding: size }) : 'tw-pl-3';
  const trailingIconPaddingResult = trailingAction ? inputPaddingVariants({ trailingIconPadding: size }) : 'tw-pr-3';

  const inputClassName = cn(
    // Leading icon padding
    leadingIconPaddingResult,
    // Trailing action padding
    trailingIconPaddingResult
  );

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
      <Input
        size={size}
        placeholder={disabled && readOnly ? readOnly : placeholder}
        disabled={disabled}
        response={response}
        {...restProps}
        className={inputClassName}
      />
      {trailingAction && (
        <TrailingBtn
          size={size}
          type={trailingAction}
          {...(trailingAction === 'clear' && { onClick: restProps.onClear })}
          disabled={trailingActionDisabled || disabled}
          className={cn('tw-absolute', inputPositionVariants({ trailingIconPosition: size }))}
        />
      )}
    </div>
  );
};

export default TextInput;
