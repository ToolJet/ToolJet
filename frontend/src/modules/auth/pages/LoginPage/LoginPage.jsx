import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import BaseLoginPage from './components/BaseLoginPage/BaseLoginPage';
import EELoginPage from '@ee/modules/auth/components/LoginPage';

const LoginPage = (props) => {
  const params = useParams();
  const { configs } = props;

  if (params?.organizationId && !configs?.id) {
    return <Navigate to="/error/invalid-link" />;
  }

  return <BaseLoginPage {...props} />;
};

export default process.env.TOOLJET_EDITION === 'ce' ? LoginPage : EELoginPage;
