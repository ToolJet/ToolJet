import React from 'react';
import { Route } from 'react-router-dom';
import { SetupAdminPage, SignupPage, WorkspaceInvitationPage, InvitationPage } from './pages';
import { AuthRoute, OrganizationInviteRoute } from '@/Routes';
import { VerificationSuccessInfoScreen } from '@/SuccessInfoScreen';
/* NOTE:
    This file should be the entry point to a module. 
    Anything inside the module shouldn't be accessible outside module folder 
*/
const Onboarding = (props) => [
  <Route key="setup" path="/setup" exact element={<SetupAdminPage />} />,
  <Route
    key="organization-invitations"
    path="/organization-invitations/:token"
    exact
    element={
      <OrganizationInviteRoute {...props} isOrgazanizationOnlyInvite={true}>
        <WorkspaceInvitationPage {...props} />
      </OrganizationInviteRoute>
    }
  />,
  <Route
    key="signup-with-org"
    path="/signup/:organizationId"
    exact
    element={
      <AuthRoute {...props}>
        <SignupPage {...props} />
      </AuthRoute>
    }
  />,
  <Route
    key="signup"
    path="/signup"
    exact
    element={
      <AuthRoute {...props}>
        <SignupPage {...props} />
      </AuthRoute>
    }
  />,
  <Route key="invitations" path="/invitations/:token" element={<InvitationPage />} />,
  <Route
    key="new-user-invitation-workspace"
    path="/invitations/:token/workspaces/:organizationToken"
    element={
      <OrganizationInviteRoute {...props}>
        <VerificationSuccessInfoScreen />
      </OrganizationInviteRoute>
    }
  />,
];

export default Onboarding;
