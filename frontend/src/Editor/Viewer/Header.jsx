import React from 'react';

const Header = ({ children, className, styles = {} }) => {
  return (
    <div style={styles} className={`header ${className}`}>
      <header className="navbar navbar-expand-md navbar-light d-print-none p-0 h-100">
        <div className="container-xl header-container position-relative">{children}</div>
      </header>
    </div>
  );
};

export default Header;
