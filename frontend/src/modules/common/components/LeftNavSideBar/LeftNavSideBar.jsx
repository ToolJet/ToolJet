import React from 'react';
import BaseLeftNavSideBar from './components/BaseLeftNavSideBar';
import EELeftNavSideBar from '@ee/modules/common/components/LeftNavSideBar';
const LeftNavSideBar = (props) => {
  return <BaseLeftNavSideBar {...props} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? LeftNavSideBar : EELeftNavSideBar;
