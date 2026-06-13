import React, { useEffect } from 'react';
import { redirectToDashboard } from '@/_helpers/routes';
import EESuperAdminLoginPage from '@ee/modules/auth/components/SuperAdminLoginPage';

const SuperAdminLoginPage = () => {
  useEffect(() => {
    redirectToDashboard();
  }, []);

  return null;
};

export default process.env.TOOLJET_EDITION === 'ce' ? SuperAdminLoginPage : EESuperAdminLoginPage;
