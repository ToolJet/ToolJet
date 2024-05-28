import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../Tooltip/tooltip';
import { HelperMessage, ValidationMessage } from '../InputUtils/InputUtils';

const EditableTitleInput = ({ size, disabled, helperText, onChange, ...restProps }) => {
  const inputRef = useRef(null);
  const [tooltipWidth, setTooltipWidth] = useState('auto');
  const [isValid, setIsValid] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    onChange(e);
    if (restProps.validation) {
      if (e.target.value === '') {
        setIsValid('');
        setMessage('');
        return;
      }
      const { valid, message } = restProps.validation(e.target.value);
      setIsValid(valid);
      setMessage(message);
    }
  };

  const inputStyle = `tw-border-transparent hover:tw-border-border-default tw-font-medium tw-pl-[12px] tw-pr-[12px] ${
    disabled ? 'placeholder:tw-text-text-placeholder' : 'placeholder:tw-text-text-default'
  } ${
    isValid === 'true'
      ? '!tw-border-border-success-strong'
      : isValid === 'false'
      ? '!tw-border-border-danger-strong'
      : ''
  }`;

  useEffect(() => {
    if (inputRef.current) {
      setTooltipWidth(inputRef.current.offsetWidth);
    }
  }, []);

  return (
    <TooltipProvider>
      <Tooltip open={!helperText && isValid === '' ? false : restProps.open}>
        <TooltipTrigger className="tw-border-none tw-bg-transparent">
          <div className="tw-relative" ref={inputRef}>
            <Input size={size} disabled={disabled} onChange={handleChange} {...restProps} className={inputStyle} />
            <SolidIcon
              name="editable"
              width="16px"
              height="16px"
              className={`tw-hidden peer-focus:tw-hidden peer-disabled:tw-hidden peer-hover:tw-block tw-absolute ${
                size === 'small' ? 'tw-top-[6px] tw-right-[6px]' : 'tw-top-[8px] tw-right-[8px]'
              }`}
              fill="var(--icon-default)"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent style={{ width: tooltipWidth }}>
          {helperText && (
            <HelperMessage helperText={helperText} className="tw-gap-[4px]" labelStyle="tw-text-text-on-solid" />
          )}
          {(isValid === 'true' || isValid === 'false') && !disabled && (
            <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[4px]" />
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default EditableTitleInput;
