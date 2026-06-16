import React from 'react';
import EELdapLoginPage from '@ee/modules/auth/components/LdapLoginPage';

const LdapLoginPage = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? LdapLoginPage : EELdapLoginPage;
