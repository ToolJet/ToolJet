import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authenticationService, appsService } from '@/_services';
import { loginConfigsService } from '@/_services/login_configs.service';
import OnboardingBackgroundWrapper from '@/modules/onboarding/components/OnboardingBackgroundWrapper';
import { setCookie } from '@/_helpers/cookie';
import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';
import { GeneralFeatureImage } from '@/modules/common/components';
import { SignupForm } from '../SignupPage/components';
import { getPostSignupRedirectPath } from '@/_helpers/platform/utils/auth.utils';
import { retrieveWhiteLabelText } from '@white-label/whiteLabelling';

const AppSignupPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [appConfig, setAppConfig] = useState(null);
  const [ssoConfigs, setSsoConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        id: 'toast-app-signup-error',
        position: 'top-center',
      });
      setLoading(false);
    }
  };

  const handleSignup = (formData, onSuccess = () => {}, onFailure = () => {}) => {
    const { email, name, password } = formData;
    const organizationId = appConfig?.organizationId;
    const redirectTo = `/applications/${slug}`;

    authenticationService
      .signup(email, name, password, organizationId, redirectTo)
      .then((response) => {
        const { current_organization_id, current_organization_slug } = response;

        if (current_organization_id || current_organization_slug) {
          const { email, id, first_name, last_name, organization_id, organization, ...restResponse } = response;
          const current_user = { email, id, first_name, last_name, organization_id, organization };

          updateCurrentSession({
            current_user,
            ...restResponse,
            authentication_status: null,
            noWorkspaceAttachedInTheSession: current_organization_id ? false : true,
            isUserLoggingIn: false,
          });

          window.location.href = `/applications/${slug}`;
        } else {
          // For editions requiring email verification, redirect to app login
          onSuccess();
          navigate(`/applications/${slug}/login`, { replace: true });
        }
      })
      .catch((e) => {
        toast.error(e?.error || 'Something went wrong!', {
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
        RightSideComponent={GeneralFeatureImage}
      />
    );
  }

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
          redirectTo={`/applications/${slug}`}
          onSubmit={handleSignup}
          setSignupOrganizationDetails={setSignupOrganizationDetails}
          initialData={{ email: '', name: '' }}
          appName={appConfig.name}
          appSlug={slug}
        />
      )}
      RightSideComponent={GeneralFeatureImage}
    />
  );
};

export default AppSignupPage;
