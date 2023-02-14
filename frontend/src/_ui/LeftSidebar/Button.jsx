import React from 'react';

const defaultDisabledStyles = {
  color: '#C1C8CD',
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

const Button = ({
  children,
  onClick,
  darkMode,
  size = 'sm',
  classNames = '',
  title = '',
  styles = {},
  disabled = false,
  isLoading = false,
}) => {
  const baseHeight = size === 'sm' ? 28 : 40;
  const baseWidth = size === 'sm' ? 92 : 150;

  const diabledStyles = {
    ...defaultDisabledStyles,
    backgroundColor: '#F1F3F5',
  };

  return (
    <div
      type="button"
      title={title}
      style={{ height: baseHeight, width: baseWidth, ...styles, ...(disabled ? diabledStyles : {}) }}
      className={`btn base-button m-1 ${darkMode && 'dark'} ${classNames} ${isLoading && 'btn-loading'}`}
      onClick={onClick}
    >
      {!isLoading && children}
    </div>
  );
};

const Content = ({ title = null, iconSrc = null, direction = 'left' }) => {
  const icon = !iconSrc ? (
    ''
  ) : (
    <img
      className="mx-1"
      src={iconSrc}
      width="12"
      height="12"
      data-cy={`${String(title).toLowerCase().replace(/\s+/g, '-')}-option-icon`}
    />
  );
  const btnTitle = !title ? (
    ''
  ) : typeof title === 'function' ? (
    title()
  ) : (
    <span data-cy={`${String(title).toLowerCase().replace(/\s+/g, '-')}-option-button`} className="mx-1">
      {title}
    </span>
  );
  const content = direction === 'left' ? [icon, btnTitle] : [btnTitle, icon];

  return content;
};

const UnstyledButton = ({ children, onClick, classNames = '', styles = {}, disabled = false }) => {
  return (
    <div
      type="button"
      style={{ ...styles, ...(disabled ? defaultDisabledStyles : {}) }}
      className={`unstyled-button ${classNames} ${disabled && 'disabled'}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

Button.Content = Content;
Button.UnstyledButton = UnstyledButton;

export default Button;
