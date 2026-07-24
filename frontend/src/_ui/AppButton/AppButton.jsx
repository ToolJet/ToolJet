import React from 'react';
import './AppButton.scss';
import SolidIcon from '../Icon/solidIcons/index';
import { Spinner } from 'react-bootstrap';
import * as Icons from '@tabler/icons-react';

export const ButtonBase = function ButtonBase(props) {
  const mapBaseSize = {
    lg: 'tj-large-btn',
    md: 'tj-medium-btn',
    sm: 'tj-small-btn',
    xs: 'tj-extra-small-btn',
  };

  const {
    className,
    size = 'lg', // specify size otherwise large button dimesnions will be applied with min width
    as = 'button', // render it as a button or an anchor.
    children,
    disabled,
    leftIcon,
    rightIcon,
    backgroundColor,
    type,
    isLoading,
    fill,
    iconCustomClass,
    iconWidth,
    customStyles = {},
    iconViewBox,
    isTablerIcon = false,
    ...restProps
  } = props;

  const isAnchor = (!!restProps.href || as === 'a') && !disabled;
  const Element = as ? as : isAnchor ? 'a' : 'button';

  const TablerIcon = ({ name, ...props }) => {
    // eslint-disable-next-line import/namespace
    const IconElement = Icons[name] === undefined ? Icons['IconHome2'] : Icons[name];
    return <IconElement {...props} />;
  };

  return (
    <Element
      {...restProps}
      className={`tj-base-btn ${mapBaseSize[size]}  ${className}`}
      disabled={disabled}
      style={
        ({
          backgroundColor: backgroundColor && backgroundColor,
        },
        { ...restProps.style, ...customStyles })
      }
      type={isAnchor ? undefined : type || 'button'}
    >
      {!isLoading && leftIcon && (
        <span className="tj-btn-left-icon">
          {isTablerIcon ? (
            <TablerIcon name={leftIcon} color={fill} size={iconWidth} className={iconCustomClass} />
          ) : (
            <SolidIcon
              fill={fill}
              className={iconCustomClass}
              name={leftIcon}
              width={iconWidth}
              viewBox={iconViewBox}
            />
          )}
        </span>
      )}
      {isLoading ? (
        <div className="spinner">
          <Spinner />
        </div>
      ) : (
        children
      )}
      {!isLoading && rightIcon && (
        <span className="tj-btn-right-icon">
          {isTablerIcon ? (
            <TablerIcon name={rightIcon} color={fill} size={iconWidth} className={iconCustomClass} />
          ) : (
            <SolidIcon className={iconCustomClass} fill={fill} name={rightIcon} width={iconWidth} />
          )}
        </span>
      )}
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
    zBlack: 'tj-zBlack-btn',
  };

  const { variant = 'primary', className, ...restProps } = props;
  return <ButtonBase {...restProps} className={`${mapVariant[variant]} ${className && className}`} />;
};
