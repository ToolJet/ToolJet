import React from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import BaseSSOConfigurationList from '@/modules/WorkspaceSettings/components/BaseSSOConfigurationList';
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

export default withEditionSpecificComponent(SSOConfigurationList, 'WorkspaceSettings');
