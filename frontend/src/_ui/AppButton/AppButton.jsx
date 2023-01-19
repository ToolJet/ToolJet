import React from 'react';
import './AppButton.scss';

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
    leftIcon,
    rightIcon,
    backgroundColor,
    ...restProps
  } = props;

  const Element = as;

  return (
    <Element
      {...restProps}
      className={`tj-base-btn ${mapBaseSize[size]}  ${className}`}
      disabled={disabled}
      style={backgroundColor && { backgroundColor }}
    >
      <span>{leftIcon}</span>
      {children}
      <span>{rightIcon}</span>
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
    dangerPrimary: 'tj-primary-danger-btn',
    dangerSecondary: 'tj-secondary-danger-btn',
    dangerTertiary: 'tj-tertiary-danger-btn',
    dangerGhost: 'tj-ghost-danger-btn',
  };

  const { variant = 'primary', className, ...restProps } = props;
  return <ButtonBase {...restProps} className={`${mapVariant[variant]} ${className && className}`} />;
};
