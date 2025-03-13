import React from 'react';
import BaseOrganizationList from '@/modules/common/components/BaseOrganizationList';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
const OrganizationList = (props) => {
  return <BaseOrganizationList {...props} />;
};
export default withEditionSpecificComponent(OrganizationList, 'Dashboard');
