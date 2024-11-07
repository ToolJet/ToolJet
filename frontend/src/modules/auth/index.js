import React from 'react';
import { Route } from 'react-router-dom';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from './pages';
import { AuthRoute } from '@/Routes';

/* NOTE:
    This file should be the entry point to the Auth module. 
    Anything inside the module shouldn't be accessible outside the module folder 
*/
const Auth = (props) => [
  <Route
    key="login-with-org"
    path="/login/:organizationId"
    exact
    element={
      <AuthRoute {...props}>
        <LoginPage {...props} />
      </AuthRoute>
    }
  />,
  <Route
    key="login"
    path="/login"
    exact
    element={
      <AuthRoute {...props}>
        <LoginPage {...props} />
      </AuthRoute>
    }
  />,
  <Route key="forgot-password" path="/forgot-password" element={<ForgotPasswordPage />} />,
  <Route key="reset-password-with-token" path="/reset-password/:token" element={<ResetPasswordPage />} />,
  <Route key="reset-password" path="/reset-password" element={<ResetPasswordPage />} />,
];

export default Auth;
