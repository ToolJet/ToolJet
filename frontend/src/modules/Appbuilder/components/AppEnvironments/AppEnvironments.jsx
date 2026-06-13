import React from 'react';
import EEAppEnvironments from '@ee/modules/Appbuilder/components/AppEnvironments';

const AppEnvironments = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppEnvironments : EEAppEnvironments;
