import React from 'react';
import PropTypes from 'prop-types';
import CommonInput from './CommonInput/Index';
import EditableTitleInput from './EditableTitleInput/Index';

const Input = (props) => {
  //Format of Validation Function
  // const validation = (x) => {
  //   // Validation logic
  //   console.log(x);
  //   return { valid: 'true', message: 'Validation message' };
  // };

  return props.type === 'editable title' ? <EditableTitleInput {...props} /> : <CommonInput {...props} />;
};

export default Input;

Input.propTypes = {
  type: PropTypes.oneOf(['text', 'number', 'editable title', 'password', 'email']),
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  readOnly: PropTypes.string,
  validation: PropTypes.func,
  label: PropTypes.string,
  'aria-label': PropTypes.string,
  required: PropTypes.bool,
  leadingIcon: PropTypes.string,
  trailingAction: PropTypes.oneOf(['clear', 'loading']),
  trailingActionDisabled: PropTypes.bool,
  helperText: PropTypes.string,
};

Input.defaultProps = {
  type: 'text',
  value: '',
  onChange: () => {},
  placeholder: '',
  name: '',
  id: '',
  size: 'medium',
  disabled: false,
  readOnly: '',
  validation: () => {},
  label: '',
  'aria-label': '',
  required: false,
  leadingIcon: '',
  trailingAction: '',
  trailingActionDisabled: false,
  helperText: '',
};
