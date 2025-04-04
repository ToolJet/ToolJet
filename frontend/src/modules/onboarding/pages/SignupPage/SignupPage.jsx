import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { onInvitedUserSignUpSuccess } from '@/_helpers/platform/utils/auth.utils';
import { SignupForm, SignupSuccessInfo } from './components';
import { GeneralFeatureImage } from '@/modules/common/components';

const SignupPage = ({ configs, organizationId }) => {
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
  useEffect(() => {
    const errorMessage = location?.state?.errorMessage;
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, []);

  const handleSignup = (formData, onSuccess = () => {}, onFaluire = () => {}) => {
    const { email, name, password } = formData;

    if (organizationToken) {
      authenticationService
        .activateAccountWithToken(email, password, organizationToken)
        .then((response) => onInvitedUserSignUpSuccess(response, navigate))
        .catch((errorObj) => {
          let errorMessage;
          const isThereAnyErrorsArray = errorObj?.error?.length && typeof errorObj?.error?.[0] === 'string';
          if (isThereAnyErrorsArray) {
            errorMessage = errorObj?.error?.[0];
          } else if (typeof errorObj?.error?.error === 'string') {
            errorMessage = errorObj?.error?.error;
          }
          errorMessage && toast.error(errorMessage);
        });
    } else {
      authenticationService
        .signup(email, name, password, inviteOrganizationId, redirectTo)
        .then((response) => {
          const { organizationInviteUrl } = response;
          if (organizationInviteUrl) onInvitedUserSignUpSuccess(response, navigate);
          setSigningUserInfo({ email, name });
          setSignupSuccess(true);
          onSuccess();
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
