import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { authenticationService } from '@/_services';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { getRedirectTo, isMcpOAuthConsentPath } from '@/_helpers/routes';
import { setCookie } from '@/_helpers/cookie';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { FeatureGraphicRightPanel } from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { LoginForm, MfaVerifyForm } from '..';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { isMcpOAuthLogin, loadMcpOAuthLoginContext } from '@/McpOAuth/loginContext';
import WorkspaceLogin from '@/McpOAuth/WorkspaceLogin';
import { RouteLoader } from '@/Routes/RouteLoader';

const BaseLoginPage = ({ configs, organizationId, currentOrganizationName, handleSSOLoginAttempt }) => {
  const { t } = useTranslation();
  const locationRef = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const redirectTo = getRedirectTo(new URLSearchParams(locationRef.search));
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const whiteLabelText = retrieveWhiteLabelText();
  const [mcpContext, setMcpContext] = useState(null);
  const [mcpResolvedReturn, setMcpResolvedReturn] = useState(null);
  const [workspaceEntry, setWorkspaceEntry] = useState(false);
  const currentReturn = new URLSearchParams(locationRef.search).get('redirectTo');
  const previousMcpReturn = useRef(false);
  const sharedMcpLogin =
    locationRef.pathname.replace(/\/+$/, '') === '/login' &&
    !organizationId &&
    !params?.organizationId &&
    Boolean(currentReturn) &&
    isMcpOAuthLogin(currentReturn);
  // Never use a saved redirect cookie to expose MCP controls on ordinary login.
  const workspaceContext = sharedMcpLogin && mcpContext?.redirectTo === currentReturn ? mcpContext : null;

  useEffect(() => {
    // React can retain this page when only the query changes. Do not carry its MCP return into normal login.
    if (previousMcpReturn.current && !isMcpOAuthConsentPath(currentReturn)) {
      setCookie('redirectPath', redirectTo, window !== window.top);
    }
    previousMcpReturn.current = isMcpOAuthConsentPath(currentReturn);
  }, [currentReturn, redirectTo]);

  useEffect(() => {
    let active = true;
    setMcpContext(null);
    setMcpResolvedReturn(null);
    setWorkspaceEntry(false);
    if (sharedMcpLogin) {
      loadMcpOAuthLoginContext(currentReturn, { includeFlow: true })
        .then((context) => active && context.organizationId === null && setMcpContext(context))
        .catch(() => {}) // Invalid or expired interactions never expose workspace entry.
        .finally(() => active && setMcpResolvedReturn(currentReturn));
    }
    return () => {
      active = false;
    };
  }, [sharedMcpLogin, currentReturn]);

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
  };

  const handleLoginSuccess = (user, email) => {
    updateCurrentSession({ isUserLoggingIn: true });
    posthogHelper.initPosthog(user);
    posthogHelper.captureEvent('signin_email', {
      email,
      workspace_id: organizationId || currentOrganizationName,
    });
    // Keep OAuth returns local to this tab; another login tab may overwrite the shared redirect cookie.
    onLoginSuccess(user, navigate, isMcpOAuthConsentPath(redirectTo) ? redirectTo : null);
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
        if (error.data?.message === 'PASSWORD_EXPIRED') {
          const orgSlug = params?.organizationId;
          const currentRedirectTo = new URLSearchParams(locationRef.search).get('redirectTo');
          navigate(
            `/password-expired?email=${encodeURIComponent(error.data?.email || email)}${
              orgSlug ? `&oid=${orgSlug}` : ''
            }${currentRedirectTo ? `&redirectTo=${encodeURIComponent(currentRedirectTo)}` : ''}`
          );
          return;
        }
        toast.error(error.error || 'Invalid email or password', {
          id: 'toast-login-auth-error',
          position: 'top-center',
          style: { maxWidth: 'unset' },
        });
      }
    );
  };

  return (
    <RouteLoader isLoading={sharedMcpLogin && mcpResolvedReturn !== currentReturn}>
      <OnboardingBackgroundWrapper
        className="feature-graphic-layout"
        LeftSideComponent={() =>
          mfaChallenge ? (
            <MfaVerifyForm
              mfaChallenge={mfaChallenge}
              onVerified={(session) => handleLoginSuccess(session, pendingEmail)}
              onError={() => {}}
            />
          ) : workspaceContext && workspaceEntry ? (
            <WorkspaceLogin context={workspaceContext} onBack={() => setWorkspaceEntry(false)} />
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
              onWorkspaceSignIn={workspaceContext ? () => setWorkspaceEntry(true) : undefined}
            />
          )
        }
        RightSideComponent={FeatureGraphicRightPanel}
      />
    </RouteLoader>
  );
};

export default BaseLoginPage;
