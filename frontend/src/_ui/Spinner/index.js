import React from 'react';
import cx from 'classnames';

const Spinner = ({ size = 'large', darkMode, ...props }) => (
  <div
    {...props}
    className={cx('spinner-border text-light', {
      'spinner-border-lg': size === 'large',
      'spinner-border-sm': size === 'small',
      'text-muted': darkMode,
    })}
    role="status"
  />
);

export default Spinner;
