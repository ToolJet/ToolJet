import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authenticationService, appsService, sessionService } from '@/_services';
import { loginConfigsService } from '@/_services/login_configs.service';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { setCookie } from '@/_helpers/cookie';
import { getSubpath } from '@/_helpers/routes';
import { ERROR_TYPES } from '@/_helpers/constants';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { SSOAuthModule } from '@/modules/common/components';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { LoginForm } from '../LoginPage/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const AppLoginPage = () => {
  const { slug } = useParams();
  const [appConfig, setAppConfig] = useState(null);
  const [ssoConfigs, setSsoConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ssoTriggered, setSsoTriggered] = useState(false);
  const whiteLabelText = retrieveWhiteLabelText();

  // Read redirectTo from URL params (set by authorizeWorkspace CASE-4 for preview URLs)
  const searchParams = new URLSearchParams(window.location.search);
  const redirectToParam = searchParams.get('redirectTo');
  // Validate: only allow /applications/ paths to prevent open redirects
  const appRedirectPath = redirectToParam?.startsWith('/applications/') ? redirectToParam : `/applications/${slug}`;

  useEffect(() => {
    // Check server-side session (not in-memory BehaviorSubject) because app auth pages
    // skip authorizeWorkspace, so the BehaviorSubject is never populated on fresh page loads.
    sessionService
      .validateSession()
      .then(() => {
        window.location.href = appRedirectPath;
      })
      .catch(() => {
        loadAppConfig();
      });
  }, [slug]);

  const loadAppConfig = async () => {
    try {
      const config = await appsService.getAppAuthenticationConfig(slug);
      setAppConfig(config);
      const redirectSearch = appRedirectPath.includes('?') ? appRedirectPath.split('?')[1] : '';
      const redirectParams = new URLSearchParams(redirectSearch);
      const isLocalPreview = !!(
        searchParams.get('version') ||
        searchParams.get('env') ||
        redirectParams.get('version') ||
        redirectParams.get('env')
      );

      // Public app: redirect directly to the app not preview apps
      if (config.isPublic && !isLocalPreview) {
        window.location.href = appRedirectPath;
        return;
      }

      // Fetch SSO configs for the workspace
      const configs = await loginConfigsService.getOrganizationConfigs(config.organizationId);
      setSsoConfigs(configs);

      // Auto-SSO: if exactly one SSO is enabled, no form login, and auto-SSO is on → trigger it
      const shouldAttemptAutoSSO =
        window.public_config?.ENABLE_WORKSPACE_LOGIN_CONFIGURATION === 'true'
          ? configs?.automatic_sso_login
          : window.public_config?.AUTOMATIC_SSO_LOGIN === 'true';

      if (shouldAttemptAutoSSO) {
        const hasEnabledOidc = Array.isArray(configs?.openid)
          ? configs.openid.some((c) => c.enabled)
          : configs?.openid?.enabled;
        const enabledSSOs = [
          configs?.google?.enabled,
          configs?.git?.enabled,
          configs?.ldap?.enabled,
          configs?.saml?.enabled,
          hasEnabledOidc,
        ].filter(Boolean);

        if (enabledSSOs.length === 1 && !configs?.form?.enabled) {
          // Set redirect cookie before auto-SSO trigger — the SSO callback reads this
          // cookie to know where to redirect after authentication. Can't use
          // setRedirectUrlToCookie() here because appConfig state hasn't updated yet.
          const iframe = window !== window.top;
          authenticationService.saveLoginOrganizationId(config.organizationId);
          setCookie('redirectPath', appRedirectPath, iframe);
          setSsoTriggered(true);
        }
      }

      setLoading(false);
    } catch (err) {
      if (err?.data?.statusCode === 404) {
        window.location = `${getSubpath() ?? ''}/error/${ERROR_TYPES.INVALID}`;
        return;
      }
      setError('Application not found');
      toast.error('Application not found', {
        id: 'toast-app-login-error',
        position: 'top-center',
      });
      setLoading(false);
    }
  };

  const setRedirectUrlToCookie = () => {
    const iframe = window !== window.top;
    authenticationService.saveLoginOrganizationId(appConfig?.organizationId);
    setCookie('redirectPath', appRedirectPath, iframe);
  };

  const handleLogin = (email, password, onError) => {
    const organizationId = appConfig?.organizationId;
    authenticationService.login(email, password, organizationId).then(
      (user) => {
        updateCurrentSession({ isUserLoggingIn: true });
        posthogHelper.initPosthog(user);
        posthogHelper.captureEvent('signin_email', {
          email,
          workspace_id: organizationId,
          app_slug: slug,
        });
        window.location.href = appRedirectPath;
      },
      (err) => {
        onError();
        toast.error(err.error || 'Invalid email or password', {
          id: 'toast-login-auth-error',
          position: 'top-center',
          style: { maxWidth: 'unset' },
        });
      }
    );
  };

  if (loading) {
    return (
      <div className="load" style={{ display: 'flex' }}>
        <div className="one"></div>
        <div className="two"></div>
        <div className="three"></div>
      </div>
    );
  }

  if (error || !appConfig || !ssoConfigs) {
    return (
      <OnboardingBackgroundWrapper
        LeftSideComponent={() => (
          <div className="login-form">
            <h2>{error || 'Unable to load application'}</h2>
          </div>
        )}
        RightSideComponent={LoginPageRightPanel}
      />
    );
  }

  if (ssoTriggered) {
    return (
      <SSOAuthModule
        configs={ssoConfigs}
        organizationSlug={appConfig.organizationId}
        setRedirectUrlToCookie={setRedirectUrlToCookie}
        buttonText="Sign in with"
        ssoTriggered={ssoTriggered}
        redirectTo={appRedirectPath}
      />
    );
  }

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => (
        <LoginForm
          configs={ssoConfigs}
          organizationId={appConfig.organizationId}
          paramOrganizationSlug={appConfig.organizationId}
          redirectTo={appRedirectPath}
          setRedirectUrlToCookie={setRedirectUrlToCookie}
          onSubmit={handleLogin}
          whiteLabelText={whiteLabelText}
          appName={appConfig.name}
          appSlug={slug}
        />
      )}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default AppLoginPage;
