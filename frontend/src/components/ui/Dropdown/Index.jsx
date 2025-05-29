import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './Select';
import { DropdownLabel, HelperMessage, ValidationMessage } from './DropdownUtils/DropdownUtils';

const DropdownComponent = ({ options = {}, ...props }) => {
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  const dropdownStyle = `${
    isValid === true ? '!tw-border-border-success-strong' : isValid === false ? '!tw-border-border-danger-strong' : ''
  }`;

  const handleOpenChange = () => {
    setOpen(!open);
    if (!open) props.onOpen?.();
    else props.onClose?.();
  };

  const handleChange = (e) => {
    let validateObj;
    if (props.validation) {
      validateObj = props.validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
    }
    props.onChange(e, validateObj);
  };

  return (
    <div>
      {props.label && <DropdownLabel label={props.label} disabled={props.disabled} required={props.required} />}
      <Select {...props} onOpenChange={handleOpenChange} onValueChange={handleChange}>
        <SelectTrigger open={open} className={dropdownStyle} {...props}>
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent zIndex={props.zIndex}>
          <SelectGroup>
            {Object.keys(options).map((key) => (
              <SelectItem
                {...props}
                value={options[key].value}
                leadingIcon={options[key].leadingIcon}
                avatarSrc={options[key].avatarSrc}
                avatarAlt={options[key].avatarAlt}
                avatarFall={options[key].avatarFall}
                key={key}
              >
                {key}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {props.helperText && (
        <HelperMessage
          helperText={props.helperText}
          className="tw-gap-[5px]"
          labelStyle={`${props.disabled ? '!tw-text-text-disabled' : ''}`}
        />
      )}
      {(isValid === true || isValid === false) && !props.disabled && (
        <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[5px]" />
      )}
    </div>
  );
};

export default DropdownComponent;

DropdownComponent.propTypes = {
  options: PropTypes.object,
  width: PropTypes.string,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  validation: PropTypes.func,
  label: PropTypes.string,
  'aria-label': PropTypes.string,
  required: PropTypes.bool,
  leadingIcon: PropTypes.bool,
  trailingAction: PropTypes.oneOf(['icon', 'counter']),
  helperText: PropTypes.string,
  zIndex: PropTypes.number,
};

DropdownComponent.defaultProps = {
  options: {},
  width: '170px',
  placeholder: '',
  name: '',
  id: '',
  size: 'medium',
  disabled: false,
  label: '',
  'aria-label': '',
  required: false,
  leadingIcon: false,
  trailingAction: '',
  helperText: '',
  zIndex: 50,
};
