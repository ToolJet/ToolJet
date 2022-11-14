import React from 'react';

const Button = ({ children, onClick, darkMode, size = 'sm', classNames = '', styles = {} }) => {
  const baseHeight = size === 'sm' ? 28 : 40;

  return (
    <div
      type="button"
      style={{ height: baseHeight, ...styles }}
      className={`btn base-button m-1 ${darkMode && 'dark'} ${classNames}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Content = ({ title = null, iconSrc = null, direction = 'left' }) => {
  const icon = !iconSrc ? '' : <img className="mx-1" src={iconSrc} width="12" height="12" />;
  const btnTitle = !title ? '' : <span className="mx-1">{title}</span>;
  const content = direction === 'left' ? [icon, btnTitle] : [btnTitle, icon];

  return content;
};

Button.Content = Content;

export default Button;
