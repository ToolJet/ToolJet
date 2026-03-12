import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { onInvitedUserSignUpSuccess, onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { SignupForm, SignupSuccessInfo } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';
import { fetchEdition } from '@/modules/common/helpers/utils';
import * as envConfigs from 'config';
import { fetchWhiteLabelDetails } from '@/_helpers/white-label/whiteLabelling';

const SignupPage = ({ configs, organizationId }) => {
  const edition = fetchEdition();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signingUserInfo, setSigningUserInfo] = useState({
    email: '',
    name: '',
  });
  const routeState = location.state;
  const organizationToken = routeState?.organizationToken;
  const inviteeEmail = routeState?.inviteeEmail;
  const inviteOrganizationId = organizationId;
  const paramInviteOrganizationSlug = params.organizationId;
  const redirectTo = location?.search?.split('redirectTo=')[1];
  if (!paramInviteOrganizationSlug && edition === 'cloud') {
    window.location.href = envConfigs.WEBSITE_SIGNUP_URL || 'https://www.tooljet.com/signup';
  }
  useEffect(() => {
    fetchWhiteLabelDetails(organizationId);
    const errorMessage = location?.state?.errorMessage;
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, []);

  const handleSignup = (formData, onSuccess = () => { }, onFaluire = () => { }) => {
    const { email, name, password } = formData;

    if (organizationToken) {
      authenticationService
        .activateAccountWithToken(email, password, organizationToken)
        .then((response) => onInvitedUserSignUpSuccess(response, navigate))
        .catch((errorObj) => {
          let errorMessage;
          if (typeof errorObj?.error === 'string') {
            errorMessage = errorObj.error; 
          }
          if (!errorMessage) {
            const isThereAnyErrorsArray = errorObj?.error?.length && typeof errorObj?.error?.[0] === 'string';
            if (errorObj?.error?.includes('reached your limit')) {
              // Note : The fix is made to handle the case when errorObj?.error is a string and not an object
              errorMessage = errorObj?.error;
            } else if (isThereAnyErrorsArray) {
              errorMessage = errorObj?.error?.[0];
            } else if (typeof errorObj?.error?.error === 'string') {
              errorMessage = errorObj?.error?.error;
            }
          }
          errorMessage && toast.error(errorMessage);
          onFaluire(errorObj);
        });
    } else {
      authenticationService
        .signup(email, name, password, inviteOrganizationId, redirectTo)
        .then((response) => {
          const { organizationInviteUrl, current_organization_id, current_organization_slug } = response;
          
          // Check if response contains login data (for non-cloud editions with auto-login)
          if (current_organization_id || current_organization_slug) {
            try {
              // Update the session context with the response data
              const { email, id, first_name, last_name, organization_id, organization, ...restResponse } = response;
              const current_user = { email, id, first_name, last_name, organization_id, organization };
              
              updateCurrentSession({
                current_user,
                ...restResponse,
                authentication_status: null,
                noWorkspaceAttachedInTheSession: current_organization_id ? false : true,
                isUserLoggingIn: false,
              });
              
              // Redirect to home/dashboard
              const redirectPath = redirectTo || '/home';
              navigate(redirectPath, { replace: true });
            } catch (error) {
              // Fallback: redirect to home/dashboard
              navigate('/', { replace: true });
            }
          } else if (organizationInviteUrl) {
            onSuccess();
            onInvitedUserSignUpSuccess(response, navigate);
          } else {
            // For cloud editions, show email verification flow
            setSigningUserInfo({ email, name });
            
            if (edition === 'cloud') {
              setSignupSuccess(true);
            } else {
              // For non-cloud editions, skip email verification screen and redirect to login.
              const loginRedirect = redirectTo ? `?redirectTo=${redirectTo}` : '';
              navigate(`/login${loginRedirect}`, { replace: true });
            }
            
            onSuccess();
          }
        })
        .catch((e) => {
          toast.error(e?.error || 'Something went wrong!', {
            position: 'top-center',
          });
          onFaluire();
        });
    }
  };

  if (paramInviteOrganizationSlug && !configs?.id) {
    return <Navigate to="/error/invalid-link" />;
  }

  const setSignupOrganizationDetails = () => {
    authenticationService.setSignUpOrganizationDetails(
      inviteOrganizationId,
      paramInviteOrganizationSlug,
      organizationToken
    );
  };

  if (signupSuccess) {
    return (
      <SignupSuccessInfo
        email={signingUserInfo.email}
        backToSignup={() => setSignupSuccess(false)}
        organizationId={organizationId}
        redirectTo={redirectTo}
      />
    );
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => (
        <SignupForm
          configs={configs}
          organizationId={inviteOrganizationId}
          paramOrganizationSlug={paramInviteOrganizationSlug}
          organizationToken={organizationToken}
          inviteeEmail={inviteeEmail}
          redirectTo={redirectTo}
          onSubmit={handleSignup}
          setSignupOrganizationDetails={setSignupOrganizationDetails}
          initialData={signingUserInfo}
        />
      )}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default SignupPage;
