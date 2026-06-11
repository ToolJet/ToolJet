import React from 'react';
import cx from 'classnames';
import './style.scss';

const Button = ({ disabled, loading, className, onClick, children, variant = 'primary', ...props }) => {
  return (
    <button
      disabled={disabled}
      type="button"
      className={cx(`btn w-100 ${className}`, {
        'btn-loading': loading,
        'btn-primary': variant === 'primary',
        'btn-outline': variant === 'outline',
        'gray-loader': loading && variant === 'outline',
      })}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
