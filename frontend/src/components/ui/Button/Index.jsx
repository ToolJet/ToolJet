import React from 'react';
import PropTypes from 'prop-types';
import { Button } from './Button';

const ButtonComponent = (props) => {
  return <Button {...props} />;
};

export default ButtonComponent;

ButtonComponent.propTypes = {
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'ghostBrand',
    'dangerPrimary',
    'dangerSecondary',
  ]),
  size: PropTypes.oneOf(['large', 'default', 'medium', 'small']),
  iconOnly: PropTypes.bool,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  fill: PropTypes.string,
  leadingIcon: PropTypes.string,
  trailingIcon: PropTypes.string,
  onClick: PropTypes.func,
};

ButtonComponent.defaultProps = {
  variant: 'primary',
  size: 'default',
  iconOnly: false,
  className: '',
  isLoading: false,
  disabled: false,
  fill: '',
  leadingIcon: '',
  trailingIcon: '',
  onClick: () => {},
};
