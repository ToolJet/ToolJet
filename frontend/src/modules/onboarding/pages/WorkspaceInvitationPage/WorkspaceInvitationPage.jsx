import React, { useEffect, useState } from 'react';
import { OnboardingUIWrapper } from '@/modules/onboarding/components';
import {
  FormTextInput,
  SubmitButton,
  FormHeader,
  FormDescription,
  EmailComponent,
  GeneralFeatureImage,
} from '@/modules/common/components';
import { appService, authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import './resources/styles/workspace_invitation_page.scss';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { toast } from 'react-hot-toast';
import {
  retrieveWhiteLabelText,
  setFaviconAndTitle,
  retrieveWhiteLabelFavicon,
  checkWhiteLabelsDefaultState,
} from '@white-label/whiteLabelling';
import { useEnterKeyPress } from '@/modules/common/hooks';

const WorkspaceInvitationPage = (props) => {
  const [isLoading, setisLoading] = React.useState(false);
  const [defaultState, setdefaultState] = React.useState(false);
  const [whiteLabelText, setWhiteLabelText] = React.useState(retrieveWhiteLabelText());
  const [whiteLabelFavicon, setWhiteLabelFavicon] = React.useState(retrieveWhiteLabelFavicon());
  const userName = props.name || '';
  const userEmail = props.email || 'abc@gmail.com';
  const invitedOrganizationName = props.invitedOrganizationName || `Tooljet's workspace`;

  const organizationId = new URLSearchParams(props?.location?.search).get('oid');
  const organizationToken = new URLSearchParams(props?.location?.search).get('organizationToken');
  const source = new URLSearchParams(props?.location?.search).get('source');
  useEnterKeyPress(() => acceptInvite());

  useEffect(() => {
    authenticationService.deleteLoginOrganizationId();
    setFaviconAndTitle(whiteLabelFavicon, whiteLabelText, props?.location);
    checkWhiteLabelsDefaultState(organizationId).then((res) => {
      setdefaultState(res);
      setWhiteLabelText(retrieveWhiteLabelText());
      setWhiteLabelFavicon(retrieveWhiteLabelFavicon());
    });
  }, []);

  const formAreaStyles = {
    marginTop: '40px',
  };
  const acceptInvite = (e) => {
    e?.preventDefault();
    const parts = props.location.pathname.split('/');
    const token = parts[2];
    setisLoading(true);
    appService
      .acceptInvite({
        token,
      })
      .then((data) => {
        toast.success(`Added to the workspace successfully.`);
        updateCurrentSession({
          isUserLoggingIn: true,
        });
        onLoginSuccess(data, props.navigate);
      })
      .catch(() => {
        toast.error('Error while setting up your account.', { position: 'top-center' });
        setisLoading(false);
      });
  };

  const LeftSideComponent = () => {
    return (
      <OnboardingUIWrapper>
        <div className="onboarding-form-width">
          <FormHeader>{`Join ${invitedOrganizationName}`}</FormHeader>
          <FormDescription>{`You are invited to ${
            invitedOrganizationName
              ? `a workspace ${invitedOrganizationName}. Accept the invite to join the workspace.`
              : whiteLabelText
          }`}</FormDescription>
          <form className="form-input-area" style={formAreaStyles}>
            <FormTextInput
              label="Name"
              value={userName}
              disabled={true}
              name="name"
              dataCy="name-input"
              readOnly="true"
              disableStartAdornment={true}
            />
            <FormTextInput
              label="Email"
              value={userEmail}
              disabled={true}
              readOnly="true"
              name="email"
              dataCy="email-input"
            />
            <SubmitButton
              onClick={(e) => acceptInvite(e)}
              className="accept-invite-button"
              buttonText="Accept Invite"
            />
          </form>
          {defaultState && (
            <p className="onboard d-block" data-cy="signup-terms-helper">
              By signing up you are agreeing to the
              <br />
              <span>
                <a href="https://www.tooljet.com/terms" data-cy="terms-of-service-link">
                  Terms of Service{' '}
                </a>
                &
                <a href="https://www.tooljet.com/privacy" data-cy="privacy-policy-link">
                  {' '}
                  Privacy Policy
                </a>
              </span>
            </p>
          )}
        </div>
      </OnboardingUIWrapper>
    );
  };
  return <OnboardingBackgroundWrapper LeftSideComponent={LeftSideComponent} RightSideComponent={GeneralFeatureImage} />;
};

export default WorkspaceInvitationPage;
