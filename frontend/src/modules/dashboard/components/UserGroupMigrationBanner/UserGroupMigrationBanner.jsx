import React from 'react';
import EEUserGroupMigrationBanner from '@ee/modules/Dashboard/components/UserGroupMigrationBanner';

const UserGroupMigrationBanner = (props) => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? UserGroupMigrationBanner : EEUserGroupMigrationBanner;
