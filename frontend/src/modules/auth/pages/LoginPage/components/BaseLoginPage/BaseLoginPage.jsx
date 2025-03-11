import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { getRedirectTo } from '@/_helpers/routes';
import { setCookie } from '@/_helpers/cookie';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { GeneralFeatureImage } from '@/modules/common/components';
import { LoginForm } from '..';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';

const BaseLoginPage = ({ configs, organizationId, currentOrganizationName, handleSSOLoginAttempt }) => {
  const { t } = useTranslation();
  const locationRef = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [redirectTo, setRedirectTo] = useState(null);
  const whiteLabelText = retrieveWhiteLabelText();

  useEffect(() => {
    setRedirectUrlToCookie();

    if (locationRef?.state?.errorMessage) {
      toast.error(locationRef.state.errorMessage, {
        id: 'toast-login-auth-error',
        position: 'top-center',
        style: { maxWidth: '50vw' },
      });
    } else {
      handleSSOLoginAttempt && handleSSOLoginAttempt();
    }
  }, []);

  const setRedirectUrlToCookie = () => {
    const iframe = window !== window.top;
    const redirectPath = getRedirectTo(
      iframe ? new URL(window.location.href).searchParams : new URL(location.href).searchParams
    );

    if (iframe) {
      window.parent.postMessage(
        {
          type: 'redirectTo',
          payload: {
            redirectPath: redirectPath,
          },
        },
        '*'
      );
    }

    authenticationService.saveLoginOrganizationId(organizationId);
    authenticationService.saveLoginOrganizationSlug(params?.organizationId);
    redirectPath && setCookie('redirectPath', redirectPath, iframe);
    setRedirectTo(redirectPath);
  };

  const handleLogin = (email, password, onError) => {
    authenticationService.login(email, password, organizationId).then(
      (user) => {
        updateCurrentSession({ isUserLoggingIn: true });
        onLoginSuccess(user, navigate);
      },
      (error) => {
        onError();
        toast.error(error.error || 'Invalid email or password', {
          id: 'toast-login-auth-error',
          position: 'top-center',
          style: { maxWidth: 'unset' },
        });
      }
    );
  };

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => (
        <LoginForm
          configs={configs}
          organizationId={organizationId}
          paramOrganizationSlug={params?.organizationId}
          redirectTo={redirectTo}
          setRedirectUrlToCookie={setRedirectUrlToCookie}
          onSubmit={handleLogin}
          currentOrganizationName={currentOrganizationName}
          whiteLabelText={whiteLabelText}
        />
      )}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default BaseLoginPage;
