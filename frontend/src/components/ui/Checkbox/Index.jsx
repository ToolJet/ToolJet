import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from './Checkbox';

const CheckboxComponent = (props) => {
  return <Checkbox {...props} />;
};

export default CheckboxComponent;

CheckboxComponent.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  intermediate: PropTypes.bool,
  label: PropTypes.string,
  helper: PropTypes.string,
  type: PropTypes.oneOf(['checkbox', 'radio', 'checkmark']),
  size: PropTypes.oneOf(['default', 'large']),
  align: PropTypes.oneOf(['left', 'right']),
  required: PropTypes.bool,
  className: PropTypes.string,
  classes: PropTypes.shape({
    checkboxLabel: PropTypes.string,
    helperText: PropTypes.string,
  }),
  onCheckedChange: PropTypes.func,
};

CheckboxComponent.defaultProps = {
  disabled: false,
  intermediate: false,
  label: '',
  helper: '',
  type: 'checkbox',
  size: 'default',
  align: 'left',
  onCheckedChange: () => {},
  required: false,
  className: '',
  classes: {
    checkboxLabel: '',
    helperText: '',
  },
};
