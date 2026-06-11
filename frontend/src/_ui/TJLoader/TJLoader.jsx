import React from 'react';
import cx from 'classnames';

export const TJLoader = () => {
  const darkModeEnabled = localStorage.getItem('darkMode') === 'true';

  return (
    <div className={cx('spin-loader', { 'theme-dark dark-theme': darkModeEnabled })}>
      <div className="load">
        <div className="one"></div>
        <div className="two"></div>
        <div className="three"></div>
      </div>
    </div>
  );
};
