import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import BaseLoginPage from './components/BaseLoginPage/BaseLoginPage';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const LoginPage = (props) => {
  const params = useParams();
  const { configs } = props;

  if (params?.organizationId && !configs?.id) {
    return <Navigate to="/error/invalid-link" />;
  }

  return <BaseLoginPage {...props} />;
};

export default withEditionSpecificComponent(LoginPage, 'auth');
