import React from 'react';
import PropTypes from 'prop-types';
import CommonInput from './CommonInput/Index';
import EditableTitleInput from './EditableTitleInput/Index';

const InputComponent = (props) => {
  return props.type === 'editable title' ? <EditableTitleInput {...props} /> : <CommonInput {...props} />;
};

export default InputComponent;

InputComponent.propTypes = {
  type: PropTypes.oneOf(['text', 'number', 'editable title', 'password', 'email']),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
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

InputComponent.defaultProps = {
  type: 'text',
  onChange: (e, validateObj) => {},
  onClear: () => {},
  placeholder: '',
  name: '',
  id: '',
  size: 'medium',
  disabled: false,
  readOnly: '',
  validation: null,
  label: '',
  'aria-label': '',
  required: false,
  leadingIcon: '',
  trailingAction: '',
  trailingActionDisabled: false,
  helperText: '',
};
