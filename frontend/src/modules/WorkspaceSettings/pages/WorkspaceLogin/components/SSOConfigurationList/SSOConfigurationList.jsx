import React from 'react';

import { pickEditionSpecificComponent } from '@/modules/common/helpers/pickEditionSpecificComponent';
import BaseSSOConfigurationList from '@/modules/WorkspaceSettings/components/BaseSSOConfigurationList';
import EESSOConfigurationList from '@ee/modules/WorkspaceSettings/components/SSOConfigurationList';
import GoogleSSOModal from '../GoogleSSOModal';
import GithubSSOModal from '../GithubSSOModal';

const SSOConfigurationList = (props) => {
  const ssoHelperText = 'Display default SSO for workspace URL login';
  // Merge props by creating a new object
  const defaultSSOModals = {
    GoogleSSOModal,
    GithubSSOModal,
  };
  const mergedProps = {
    ...props,
    ssoHelperText: ssoHelperText,
    defaultSSOModals: defaultSSOModals,
  };

  return <BaseSSOConfigurationList {...mergedProps} />;
};

export default pickEditionSpecificComponent({
  ce: SSOConfigurationList,
  ee: EESSOConfigurationList,
  cloudSameAsEE: true,
});
