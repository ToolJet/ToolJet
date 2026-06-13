import React from 'react';
import BaseOrganizationList from '@/modules/common/components/BaseOrganizationList';
import EEOrganizationList from '@ee/modules/Dashboard/components/OrganizationList';
const OrganizationList = (props) => {
  return <BaseOrganizationList {...props} />;
};
export default process.env.TOOLJET_EDITION === 'ce' ? OrganizationList : EEOrganizationList;
