import React from 'react';
import './Icon.scss';
import { Icons } from './allIcons/index.js';

const Icon = (props) => {
  const name = { props };
  const Icon = Icons[name];
  return <img src={Icon} className="icon-wrapper-class-name" />;
};
export default Icon;
