import React from 'react';
import PropTypes from 'prop-types';
import { Textarea } from './textarea';
import { HelperMessage, InputLabel, ValidationMessage } from './TextareaUtils/TextareaUtils';

const TextArea = (props) => {
  const [isValid, setIsValid] = React.useState('');
  const [message, setMessage] = React.useState('');

  const inputStyle = `${
    isValid === 'true'
      ? '!tw-border-border-success-strong'
      : isValid === 'false'
      ? '!tw-border-border-danger-strong'
      : ''
  }`;

  //Format of Validation Function
  // const validation = (x) => {
  //   // Validation logic
  //   console.log(x);
  //   return { valid: 'false', message: 'Validation message' };
  // };

  const handleChange = (e) => {
    props.onChange(e);
    if (props.validation) {
      if (e.target.value === '') {
        setIsValid('');
        setMessage('');
        return;
      }
      const { valid, message } = props.validation(e.target.value);
      setIsValid(valid);
      setMessage(message);
    }
  };

  return (
    <div>
      {props.label && <InputLabel label={props.label} disabled={props.disabled} required={props.required} />}
      <Textarea {...props} onChange={handleChange} className={inputStyle} />
      {props.helperText && (
        <HelperMessage
          helperText={props.helperText}
          className="tw-gap-[5px]"
          labelStyle={`${props.disabled ? 'tw-text-text-disabled' : ''}`}
        />
      )}
      {(isValid === 'true' || isValid === 'false') && !props.disabled && (
        <ValidationMessage response={isValid} validationMessage={message} className="tw-gap-[5px]" />
      )}
    </div>
  );
};

export default TextArea;

TextArea.propTypes = {
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

TextArea.defaultProps = {
  placeholder: '',
  label: '',
  helperText: '',
  disabled: false,
  required: false,
  onChange: () => {},
  validation: () => {},
  name: '',
  id: '',
  'aria-label': '',
};
