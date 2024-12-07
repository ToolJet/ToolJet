import React from 'react';
import PropTypes from 'prop-types';
import { Textarea } from './Textarea';
import { HelperMessage, InputLabel, ValidationMessage } from './TextareaUtils/TextareaUtils';

const TextAreaComponent = ({ onChange, ...props }) => {
  const [isValid, setIsValid] = React.useState(null);
  const [message, setMessage] = React.useState('');

  const inputStyle = `${
    isValid === true ? '!tw-border-border-success-strong' : isValid === false ? '!tw-border-border-danger-strong' : ''
  }`;

  const handleChange = (e) => {
    let validateObj;
    if (props.validation) {
      validateObj = props.validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
    }
    onChange(e, validateObj);
  };

  return (
    <div>
      {props.label && <InputLabel label={props.label} disabled={props.disabled} required={props.required} />}
      <Textarea {...props} onValueChange={handleChange} className={inputStyle} />
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

export default TextAreaComponent;

TextAreaComponent.propTypes = {
  width: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  onChange: PropTypes.func,
  validation: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  'aria-label': PropTypes.string,
};

TextAreaComponent.defaultProps = {
  placeholder: '',
  label: '',
  helperText: '',
  disabled: false,
  required: false,
  onChange: (e, validateObj) => {},
  validation: () => {},
  name: '',
  id: '',
  'aria-label': '',
};
