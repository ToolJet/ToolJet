import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '../../utilComponents/loader';

export const getDefaultIconFillColor = (variant) => {
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'var(--icon-on-solid)';
    case 'secondary':
    case 'ghostBrand':
      return 'var(--icon-brand)';
    case 'outline':
    case 'ghost':
      return 'var(--icon-strong)';
    case 'dangerSecondary':
    case 'dangerGhost':
      return 'var(--icon-danger)';
    default:
      return '';
  }
};

export const defaultButtonFillColour = ['#FFFFFF', '#4368E3', '#ACB2B9', '#D72D39'];

export const getIconSize = (size) => {
  switch (size) {
    case 'large':
      return '20px';
    case 'default':
      return '16px';
    case 'medium':
      return '14px';
    case 'small':
      return '12px';
  }
};

export const Loading = ({ children, fill, size }) => {
  return (
    <div className="tw-flex tw-justify-center tw-items-center">
      <Loader color={fill} width={getIconSize(size)} />
      <a className="tw-invisible">{children}</a>
    </div>
  );
};

export const LeadingIcon = ({ leadingIcon, size, fill }) => {
  return <SolidIcon name={leadingIcon} height={getIconSize(size)} width={getIconSize(size)} fill={fill} />;
};

export const TrailingIcon = ({ trailingIcon, size, fill }) => {
  return <SolidIcon name={trailingIcon} height={getIconSize(size)} width={getIconSize(size)} fill={fill} />;
};
