import React from 'react';
import EEGitSyncManager from '@ee/modules/Appbuilder/components/GitSyncManager';

const GitSyncManager = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? GitSyncManager : EEGitSyncManager;
