import React from 'react';

const Header = ({ children, className }) => {
  return (
    <div
      style={{
        minHeight: 45,
      }}
      className={`header ${className}`}
    >
      <header className="navbar navbar-expand-md d-print-none">
        <div className="container-xl header-container position-relative">{children}</div>
      </header>
    </div>
  );
};

export default Header;
