import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import BaseLeftNavSideBar from './components/BaseLeftNavSideBar';
const LeftNavSideBar = (props) => {
  return <BaseLeftNavSideBar {...props} />;
};

export default withEditionSpecificComponent(LeftNavSideBar, 'common');
