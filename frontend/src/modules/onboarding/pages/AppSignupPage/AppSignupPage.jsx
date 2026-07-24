import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authenticationService, appsService, sessionService } from '@/_services';
import { loginConfigsService } from '@/_services/login_configs.service';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { setCookie } from '@/_helpers/cookie';
import { getSubpath } from '@/_helpers/routes';
import { ERROR_TYPES } from '@/_helpers/constants';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import LoginPageRightPanel from '@/modules/auth/components/LoginPageRightPanel/LoginPageRightPanel';
import { SignupForm } from '../SignupPage/components';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';

const AppSignupPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [appConfig, setAppConfig] = useState(null);
  const [ssoConfigs, setSsoConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preserve preview URL params from the login page's redirectTo
  const searchParams = new URLSearchParams(window.location.search);
  const redirectToParam = searchParams.get('redirectTo');
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
      const redirectSearch = appRedirectPath.includes('?') ? appRedirectPath.split('?')[1] : '';
      const redirectParams = new URLSearchParams(redirectSearch);
      const isLocalPreview = !!(
        searchParams.get('version') ||
        searchParams.get('env') ||
        redirectParams.get('version') ||
        redirectParams.get('env')
      );
      setAppConfig(config);

      // Public app: redirect directly to the app not preview apps
      if (config.isPublic && !isLocalPreview) {
        window.location.href = appRedirectPath;
        return;
      }

      // Fetch SSO configs for the workspace
      const configs = await loginConfigsService.getOrganizationConfigs(config.organizationId);
      setSsoConfigs(configs);
      setLoading(false);
    } catch (err) {
      if (err?.data?.statusCode === 404) {
        window.location = `${getSubpath() ?? ''}/error/${ERROR_TYPES.INVALID}`;
        return;
      }
      setError('Application not found');
      toast.error('Application not found', {
        id: 'toast-app-signup-error',
        position: 'top-center',
      });
      setLoading(false);
    }
  };

  const handleSignup = (formData, onSuccess = () => {}, onFailure = () => {}) => {
    const { email, name, password } = formData;
    const organizationId = appConfig?.organizationId;
    const redirectTo = appRedirectPath;

    authenticationService
      .signup(email, name, password, organizationId, redirectTo)
      .then((response) => {
        const { current_organization_id, current_organization_slug } = response;

        if (current_organization_id || current_organization_slug) {
          onLoginSuccess(response, navigate, appRedirectPath);
        } else {
          // For editions requiring email verification, redirect to app login with redirectTo preserved
          onSuccess();
          const loginRedirectParam =
            appRedirectPath !== `/applications/${slug}` ? `?redirectTo=${encodeURIComponent(appRedirectPath)}` : '';
          navigate(`/applications/${slug}/login${loginRedirectParam}`, { replace: true });
        }
      })
      .catch((e) => {
        const errorMsg = e?.error || '';
        const isUserLimitError =
          errorMsg.toLowerCase().includes('user limit') || errorMsg.toLowerCase().includes('license violation');
        const message = isUserLimitError ? (
          <span>
            User limit reached.
            <br />
            Please contact admin to know more.
          </span>
        ) : (
          errorMsg || 'Something went wrong!'
        );
        toast.error(message, {
          position: 'top-center',
        });
        onFailure();
      });
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
          <div className="signup-form">
            <h2>{error || 'Unable to load application'}</h2>
          </div>
        )}
        RightSideComponent={LoginPageRightPanel}
      />
    );
  }

  const setRedirectUrlToCookie = () => {
    const iframe = window !== window.top;
    authenticationService.saveLoginOrganizationId(appConfig?.organizationId);
    setCookie('redirectPath', appRedirectPath, iframe);
  };

  const setSignupOrganizationDetails = () => {
    authenticationService.setSignUpOrganizationDetails(appConfig.organizationId, appConfig.organizationId, null);
  };

  return (
    <OnboardingBackgroundWrapper
      LeftSideComponent={() => (
        <SignupForm
          configs={ssoConfigs}
          organizationId={appConfig.organizationId}
          paramOrganizationSlug={appConfig.organizationId}
          redirectTo={appRedirectPath}
          setRedirectUrlToCookie={setRedirectUrlToCookie}
          onSubmit={handleSignup}
          setSignupOrganizationDetails={setSignupOrganizationDetails}
          initialData={{ email: '', name: '' }}
          appName={appConfig.name}
          appSlug={slug}
        />
      )}
      RightSideComponent={LoginPageRightPanel}
    />
  );
};

export default AppSignupPage;
