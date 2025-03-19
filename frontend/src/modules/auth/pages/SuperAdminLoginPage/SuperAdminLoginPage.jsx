import React, { useEffect } from 'react';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import { redirectToDashboard } from '@/_helpers/routes';

const SuperAdminLoginPage = () => {
  useEffect(() => {
    redirectToDashboard();
  }, []);

  return null;
};

export default withEditionSpecificComponent(SuperAdminLoginPage, 'auth');
