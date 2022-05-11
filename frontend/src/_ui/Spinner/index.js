import React from 'react';
import cx from 'classnames';

const Spinner = ({ size = 'large', ...props }) => (
  <div
    {...props}
    className={cx('spinner-border text-muted', {
      'spinner-border-lg': size === 'large',
      'spinner-border-sm': size === 'small',
    })}
    role="status"
  />
);

export default Spinner;
