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
  const baseHeight = size === 'sm' ? 28 : size === 'md' ? 36 : 40;
  const baseWidth = size === 'sm' ? 92 : size === 'md' ? 100 : 150;

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

const Content = ({ title = null, iconSrc = null, direction = 'left', dataCy }) => {
  const Icon = !iconSrc ? (
    ''
  ) : (
    <img
      className="mx-1"
      src={iconSrc}
      width="12"
      height="12"
      data-cy={`${String(dataCy ?? title)
        .toLowerCase()
        .replace(/\s+/g, '-')}-option-icon`}
    />
  );
  const BtnTitle = !title ? (
    ''
  ) : typeof title === 'function' ? (
    title()
  ) : (
    <span
      data-cy={`${String(typeof title === 'function' ? title() : title)
        .toLowerCase()
        .replace(/\s+/g, '-')}-option-button`}
      className="mx-1"
    >
      {title}
    </span>
  );

  const content =
    direction === 'left' ? (
      <>
        {Icon}
        {BtnTitle}
      </>
    ) : (
      <>
        {BtnTitle}
        {Icon}
      </>
    );

  return content;
};

const UnstyledButton = ({ children, onClick, classNames = '', styles = {}, disabled = false, darkMode = false }) => {
  const cursorNotPointer = onClick === undefined && { cursor: 'default' };

  return (
    <div
      type="button"
      style={{ ...styles, ...(disabled ? defaultDisabledStyles : {}), ...cursorNotPointer }}
      className={`unstyled-button ${classNames} ${disabled && 'disabled'} ${darkMode && 'dark'}`}
      onMouseDown={onClick}
    >
      {children}
    </div>
  );
};

Button.Content = Content;
Button.UnstyledButton = UnstyledButton;

export default Button;
