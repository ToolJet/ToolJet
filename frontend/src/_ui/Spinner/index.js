import React from 'react';
import cx from 'classnames';
import useAppDarkMode from '@/_hooks/useAppDarkMode';

const Spinner = ({ size = 'large', ...props }) => {
  const { isAppDarkMode } = useAppDarkMode();
  return (
    <div
      {...props}
      className={cx('spinner-border spinner-light', {
        'spinner-border-lg': size === 'large',
        'spinner-border-sm': size === 'small',
        'text-muted': isAppDarkMode,
      })}
      role="status"
    ></div>
  );
};

export default Spinner;
