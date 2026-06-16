// src/modules/OrganizationSettings/OrganizationLogin/AutoSSOLogin.jsx

import React from 'react';
import EEAutoSSOLogin from '@ee/modules/WorkspaceSettings/components/AutoSSOLogin';

const AutoSSOLogin = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AutoSSOLogin : EEAutoSSOLogin;
