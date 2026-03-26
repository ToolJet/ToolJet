import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authenticationService, appsService } from '@/_services';
import { loginConfigsService } from '@/_services/login_configs.service';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { setCookie } from '@/_helpers/cookie';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { GeneralFeatureImage } from '@/modules/common/components';
import { LoginForm } from '../LoginPage/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const AppLoginPage = () => {
  const { slug } = useParams();
  const [appConfig, setAppConfig] = useState(null);
  const [ssoConfigs, setSsoConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const whiteLabelText = retrieveWhiteLabelText();

  useEffect(() => {
    // If user is already authenticated, redirect directly to the app
    const currentSession = authenticationService.currentSessionValue;
    if (currentSession?.current_user?.id) {
      window.location.href = `/applications/${slug}`;
      return;
    }
    loadAppConfig();
  }, [slug]);

  const loadAppConfig = async () => {
    try {
      const config = await appsService.getAppAuthenticationConfig(slug);
      setAppConfig(config);

      // Public app: redirect directly to the app
      if (config.isPublic) {
        window.location.href = `/applications/${slug}`;
        return;
      }

      // Fetch SSO configs for the workspace
      const configs = await loginConfigsService.getOrganizationConfigs(config.organizationId);
      setSsoConfigs(configs);
      setLoading(false);
    } catch (err) {
      setError('Application not found');
      toast.error('Application not found', {
        id: 'toast-app-login-error',
        position: 'top-center',
      });
      setLoading(false);
    }
  };

  const setRedirectUrlToCookie = () => {
    const redirectPath = `/applications/${slug}`;
    const iframe = window !== window.top;
    authenticationService.saveLoginOrganizationId(appConfig?.organizationId);
    setCookie('redirectPath', redirectPath, iframe);
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
        window.location.href = `/applications/${slug}`;
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
        RightSideComponent={GeneralFeatureImage}
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
          redirectTo={`/applications/${slug}`}
          setRedirectUrlToCookie={setRedirectUrlToCookie}
          onSubmit={handleLogin}
          whiteLabelText={whiteLabelText}
          appName={appConfig.name}
          appSlug={slug}
        />
      )}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default AppLoginPage;
