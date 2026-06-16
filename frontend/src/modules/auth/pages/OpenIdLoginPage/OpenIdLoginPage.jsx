import React from 'react';
import EEOpenIdLoginPage from '@ee/modules/auth/components/OpenIdLoginPage';

export const OpenIdLoginPage = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? OpenIdLoginPage : EEOpenIdLoginPage;
