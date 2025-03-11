import React from 'react';
import { Route } from 'react-router-dom';
import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SuperadminLoginPage,
  OpenIdLoginPage,
  LdapLoginPage,
} from './pages';
import { AuthRoute } from '@/Routes';

/* NOTE:
    This file should be the entry point to the Auth module. 
    Anything inside the module shouldn't be accessible outside the module folder 
*/
const Auth = (props) => [
  <Route
    key="super-admin-login"
    path="/login/super-admin"
    exact
    element={
      <AuthRoute {...props}>
        <SuperadminLoginPage />
      </AuthRoute>
    }
  />,
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
  <Route key="openid-login-with-org" path="/login/:organizationId/sso/openid" exact element={<OpenIdLoginPage />} />,
  <Route key="openid-login" path="/login/sso/openid" exact element={<OpenIdLoginPage />} />,
  <Route key="ldap-login" path="/ldap/:organizationId" element={<LdapLoginPage {...props} />} />,
];

export default Auth;
