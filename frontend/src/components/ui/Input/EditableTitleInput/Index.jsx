import SolidIcon from '@/_ui/Icon/SolidIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../Input';
import { HelperMessage, ValidationMessage } from '../InputUtils/InputUtils';
import Tooltip from '../../Tooltip/Tooltip';

const EditableTitleInput = ({ size, disabled, helperText, onChange: change, readOnly, placeholder, ...restProps }) => {
  const inputRef = useRef(null);
  const [tooltipWidth, setTooltipWidth] = useState('auto');
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    let validateObj;
    if (restProps.validation) {
      validateObj = restProps.validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
    }
    change(e, validateObj);
  };

  const inputStyle = `tw-border-transparent hover:tw-border-border-default tw-font-medium tw-pl-[12px] tw-pr-[12px] ${
    disabled ? 'placeholder:tw-text-text-placeholder' : 'placeholder:tw-text-text-default'
  } ${
    isValid === true ? '!tw-border-border-success-strong' : isValid === false ? '!tw-border-border-danger-strong' : ''
  }`;

  useEffect(() => {
    if (inputRef.current) {
      setTooltipWidth(inputRef.current.offsetWidth);
    }
  }, []);

  return (
    <div className="tw-relative">
      <div className="tw-peer tw-relative" ref={inputRef}>
        <Input
          size={size}
          disabled={disabled}
          placeholder={disabled && readOnly ? readOnly : placeholder}
          onChange={handleChange}
          {...restProps}
          className={inputStyle}
        />
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
      {helperText && isValid === null && (
        <Tooltip
          arrow="Top Center"
          className="tw-absolute tw-hidden peer-hover:tw-flex"
          theme="dark"
          width={tooltipWidth}
        >
          <HelperMessage helperText={helperText} className="tw-gap-[4px]" labelStyle="tw-text-text-on-solid" />
        </Tooltip>
      )}
      {(isValid === true || isValid === false) && !disabled && message !== '' && (
        <Tooltip
          arrow="Top Center"
          className="tw-absolute tw-hidden peer-hover:tw-flex"
          theme="dark"
          width={tooltipWidth}
        >
          <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[4px]" />
        </Tooltip>
      )}
    </div>
  );
};

export default EditableTitleInput;
