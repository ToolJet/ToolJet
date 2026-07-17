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
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { LoginForm, MfaVerifyForm } from '..';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const BaseLoginPage = ({ configs, organizationId, currentOrganizationName, handleSSOLoginAttempt }) => {
  const { t } = useTranslation();
  const locationRef = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [redirectTo, setRedirectTo] = useState(null);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
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

  const handleLoginSuccess = (user, email) => {
    updateCurrentSession({ isUserLoggingIn: true });
    posthogHelper.initPosthog(user);
    posthogHelper.captureEvent('signin_email', {
      email,
      workspace_id: organizationId || currentOrganizationName,
    });
    onLoginSuccess(user, navigate);
  };

  const handleLogin = (email, password, onError) => {
    authenticationService.login(email, password, organizationId).then(
      (user) => {
        if (user?.mfa_required) {
          setPendingEmail(email);
          setMfaChallenge({
            mfaToken: user.mfa_token,
            setupRequired: user.setup_required,
            otpauthUrl: user.otpauth_url,
            secret: user.secret,
          });
          onError();
          return;
        }
        handleLoginSuccess(user, email);
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
      LeftSideComponent={() =>
        mfaChallenge ? (
          <MfaVerifyForm
            mfaChallenge={mfaChallenge}
            onVerified={(session) => handleLoginSuccess(session, pendingEmail)}
            onError={() => {}}
          />
        ) : (
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
        )
      }
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default BaseLoginPage;
