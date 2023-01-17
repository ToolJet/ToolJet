import React from 'react';

export const ButtonBase = function ButtonBase(props) {
  const mapBaseSize = {
    lg: 'tj-large-btn',
    md: 'tj-medium-btn',
    sm: 'tj-small-btn',
    xs: 'tj-extra-small-btn',
  };

  const {
    className,
    size = 'lg',
    as = 'button', // render it as a button or an anchor.
    children,
    disabled,
    ...restProps
  } = props;

  const Element = as;

  return (
    <Element {...restProps} className={`tj-base-btn ${mapBaseSize[size]}  ${className}`} disabled={disabled}>
      {children}
    </Element>
  );
};

export const ButtonSolid = function ButtonSolid(props) {
  const mapVariant = {
    primary: 'tj-primary-btn',
    ghostBlue: 'tj-ghost-blue-btn',
    ghostBlack: 'tj-ghost-black-btn',
    secondary: 'tj-secondary-btn',
    tertiary: 'tj-tertiary-btn',
    disabled: 'tj-disabled-btn',
    danger: 'tj-danger-btn',
  };

  const { variant = 'primary', className, ...restProps } = props;
  return <ButtonBase {...restProps} className={`${mapVariant[variant]} ${className}`} />;
};

export const IconButton = function IconButton(props) {
  const { className, size = 'lg', as = 'button', Icon, ...restProps } = props;

  const Element = as;

  return (
    <Element {...restProps} className={`tj-icon-btn ${className}`}>
      {Icon}
    </Element>
  );
};
