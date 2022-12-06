import React from 'react';

export const ButtonBase = function ButtonBase(props) {
  const mapBaseSize = {
    base: 'tj-btn-base',
    lg: 'tj-btn-large',
  };

  const {
    className,
    size = 'base',
    as = 'button', // render it as a button or an anchor.
    children,
    disabled,
    ...restProps
  } = props;

  const Element = as;

  return (
    <Element {...restProps} className={`tj-btn ${mapBaseSize[size]}  ${className}`} disabled={disabled}>
      {children}
    </Element>
  );
};

export const ButtonSolid = function ButtonSolid(props) {
  const mapVariant = {
    primary: 'tj-btn-primary',
    ghost: 'tj-btn-ghost',
    secondary: 'tj-btn-secondary',
    tertiary: 'tj-btn-tertiary',
    disabled: 'tj-btn-disabled',
  };

  const { variant = 'primary', className, ...restProps } = props;
  return <ButtonBase {...restProps} className={`${mapVariant[variant]} ${className}`} />;
};

export const IconButton = function IconButton(props) {
  const { className, size = 'base', as = 'button', Icon, ...restProps } = props;

  const Element = as;

  return (
    <Element {...restProps} className={`generated-icon-classnames ${className}`}>
      {Icon}
    </Element>
  );
};
