import React from 'react';
import classNames from 'classnames';

const Header = ({ children, className, styles = {}, showNavbarClass = true }) => {
  return (
    <div
      style={{
        minHeight: '32px',
        ...styles,
      }}
      className={`header ${className}`}
    >
      <header className={classNames('p-0', { 'navbar navbar-expand-md': showNavbarClass })}>
        <div className="container-xl py-3 px-2 header-container position-relative">{children}</div>
      </header>
    </div>
  );
};

export default Header;
