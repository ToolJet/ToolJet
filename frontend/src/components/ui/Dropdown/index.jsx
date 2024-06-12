import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './select';
import { DropdownLabel, HelperMessage, ValidationMessage } from './DropdownUtils/DropdownUtils';

const Dropdown = ({ options = {}, ...props }) => {
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState('');
  const [message, setMessage] = useState('');

  const dropdownStyle = `${
    isValid === 'true'
      ? '!tw-border-border-success-strong'
      : isValid === 'false'
      ? '!tw-border-border-danger-strong'
      : ''
  }`;

  const handleOpenChange = () => {
    setOpen(!open);
  };

  //Format of Validation Function
  // const validation = (x) => {
  //   // Validation logic
  //   console.log(x);
  //   return { valid: 'false', message: 'Validation message' };
  // };

  const handleChange = (e) => {
    props.onChange(e);
    if (props.validation) {
      if (e === '') {
        setIsValid('');
        setMessage('');
        return;
      }
      const { valid, message } = props.validation(e);
      setIsValid(valid);
      setMessage(message);
    }
  };

  return (
    <div>
      {props.label && <DropdownLabel label={props.label} disabled={props.disabled} required={props.required} />}
      <Select {...props} onOpenChange={handleOpenChange} onValueChange={handleChange}>
        <SelectTrigger open={open} className={dropdownStyle} {...props}>
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {Object.keys(options).map((key) => (
              <SelectItem
                {...props}
                value={options[key]}
                // avatarSrc="https://github.com/shadcn.png"
                // avatarAlt="@shadcn"
                // avatarFall="CN"
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
      {(isValid === 'true' || isValid === 'false') && !props.disabled && (
        <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[5px]" />
      )}
    </div>
  );
};

export default Dropdown;

Dropdown.propTypes = {
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
};

Dropdown.defaultProps = {
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
};
