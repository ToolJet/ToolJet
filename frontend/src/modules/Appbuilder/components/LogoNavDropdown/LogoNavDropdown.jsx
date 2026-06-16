import React from 'react';
import BaseLogoNavDropdown from '@/modules/common/components/BaseLogoNavDropdown';
import EELogoNavDropdown from '@ee/modules/Appbuilder/components/LogoNavDropdown';

const LogoNavDropdown = (props) => {
  return <BaseLogoNavDropdown {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? LogoNavDropdown : EELogoNavDropdown;
