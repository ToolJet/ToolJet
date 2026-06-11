import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import BaseLogoNavDropdown from '@/modules/common/components/BaseLogoNavDropdown';

const LogoNavDropdown = (props) => {
  return <BaseLogoNavDropdown {...props} />;
};
export default withEditionSpecificComponent(LogoNavDropdown, 'Appbuilder');
