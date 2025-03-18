import React from 'react';
import PropTypes from 'prop-types';
import { Switch } from './Switch';

const SwitchComponent = (props) => {
  return <Switch {...props} />;
};

export default SwitchComponent;

SwitchComponent.propTypes = {
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  helper: PropTypes.string,
  size: PropTypes.oneOf(['default', 'large']),
  align: PropTypes.oneOf(['left', 'right']),
  required: PropTypes.bool,
  className: PropTypes.string,
};

SwitchComponent.defaultProps = {
  disabled: false,
  label: '',
  helper: '',
  size: 'default',
  align: 'left',
  required: false,
  className: '',
};
