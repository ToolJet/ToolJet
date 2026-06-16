import React from 'react';
import EEUserMetadata from '@ee/modules/WorkspaceSettings/components/UserMetadata';

const UserMetadata = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? UserMetadata : EEUserMetadata;
