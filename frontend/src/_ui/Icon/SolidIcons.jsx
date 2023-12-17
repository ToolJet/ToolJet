import React from 'react';
import './Icon.scss';
import Icon from './solidIcons/index';

const SolidIcon = (props) => {
  const { name, ...restProps } = props;
  return <Icon {...restProps} name={name} />;
};

export default SolidIcon;
