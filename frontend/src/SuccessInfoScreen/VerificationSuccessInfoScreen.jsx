import React, { useState, useEffect } from 'react';
import EnterIcon from '../../assets/images/onboardingassets/Icons/Enter';
import OnBoardingForm from '../OnBoardingForm/OnBoardingForm';
import { authenticationService, loginConfigsService } from '@/_services';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LinkExpiredInfoScreen } from '@/SuccessInfoScreen';
import { ShowLoading } from '@/_components';
import { toast } from 'react-hot-toast';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { ButtonSolid } from '@/_components/AppButton';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { useTranslation } from 'react-i18next';
import { buildURLWithQuery } from '@/_helpers/utils';
import { onLoginSuccess } from '@/_helpers/platform/utils/auth.utils';
import { retrieveWhiteLabelText, setFaviconAndTitle, checkWhiteLabelsDefaultState } from '@white-label/whiteLabelling';

export const VerificationSuccessInfoScreen = function VerificationSuccessInfoScreen() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState(false);
  const [userDetails, setUserDetails] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinWorkspace, setShowJoinWorkspace] = useState(false);
  const [isGettingConfigs, setIsGettingConfigs] = useState(true);
  const [configs, setConfigs] = useState({});
  const [password, setPassword] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [fallBack, setFallBack] = useState(false);
  const { t } = useTranslation();
  const [defaultState, setDefaultState] = useState(false);

  const location = useLocation();
  const params = useParams();
  const searchParams = new URLSearchParams(location?.search);

  const organizationId = searchParams.get('oid');
  const organizationToken = searchParams.get('organizationToken') || params?.organizationToken;
  const source = searchParams.get('source');
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const redirectTo = searchParams.get('redirectTo');
  const navigate = useNavigate();
  const whiteLabelText = retrieveWhiteLabelText();

  const getUserDetails = () => {
    setIsLoading(true);
    authenticationService
      .verifyToken(params?.token, organizationToken)
      .then((data) => {
        if (data?.redirect_url) {
          window.location.href = buildURLWithQuery(data.redirect_url, {
            ...(organizationId ? { oid: organizationId } : {}),
            ...(source ? { source } : {}),
          });
          return;
        }
        setUserDetails(data);
        setIsLoading(false);
        if (data?.email !== '') {
          if (organizationToken) {
            setShowJoinWorkspace(true);
            return;
          }
          setVerifiedToken(true);
        }
      })
      .catch(({ error }) => {
        setIsLoading(false);
        toast.error(error, { position: 'top-center' });
        setFallBack(true);
      });
  };

  useEffect(() => {
    getUserDetails();

    if (source == 'sso') setShowJoinWorkspace(true);
    authenticationService.deleteLoginOrganizationId();
    if (organizationId) {
      authenticationService.saveLoginOrganizationId(organizationId);
      organizationId &&
        loginConfigsService.getOrganizationConfigs(organizationId).then(
          (configs) => {
            setIsGettingConfigs(false);
            setConfigs(configs);
            setFaviconAndTitle(location);
          },
          () => {
            setIsGettingConfigs(false);
          }
        );
    } else {
      setIsGettingConfigs(false);
    }
    checkWhiteLabelsDefaultState(organizationId).then((res) => {
      setDefaultState(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keyDownHandler = (event) => {
      if (event.key === 'Enter') {
        clickContinue(event);
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails]);

  const setUpAccount = (e) => {
    e.preventDefault();
    setIsLoading(true);
    authenticationService
      .onboarding({
        companyName: '',
        companySize: '',
        role: '',
        token: params?.token,
        organizationToken,
        source,
        password: password,
      })
      .then((user) => {
        authenticationService.deleteLoginOrganizationId();
        setIsLoading(false);
        onLoginSuccess(user, navigate, redirectTo);
      })
      .catch((res) => {
        setIsLoading(false);
        toast.error(res.error || 'Something went wrong', {
          id: 'toast-login-auth-error',
          position: 'top-center',
        });
      });
  };

  const handleOnCheck = () => {
    setShowPassword(!showPassword);
  };
  const handleChange = (event) => {
    setPassword(event.target.value);
  };
  const clickContinue = (e) => {
    if (showJoinWorkspace && !showOnboarding) {
      e.preventDefault();
      userDetails?.onboarding_details?.password && userDetails?.onboarding_details?.questions
        ? (setShowOnboarding(true), setShowJoinWorkspace(false))
        : setUpAccount(e);
      return;
    }

    userDetails?.onboarding_details?.questions && !userDetails?.onboarding_details?.password
      ? setShowOnboarding(true)
      : (userDetails?.onboarding_details?.password && !userDetails?.onboarding_details?.questions) ||
        (userDetails?.onboarding_details?.password && userDetails?.onboarding_details?.questions)
      ? setShowJoinWorkspace(true)
      : setUpAccount(e);
  };

  return (
    <div>
      {isGettingConfigs && (
        <div className="common-auth-section-whole-wrapper page">
          <div className="common-auth-section-left-wrapper">
            <div className="loader-wrapper">
              <ShowLoading />
            </div>
          </div>
        </div>
      )}

      {showJoinWorkspace && !showOnboarding && (
        <div className="page common-auth-section-whole-wrapper">
          <div className="common-auth-section-left-wrapper">
            <OnboardingNavbar darkMode={darkMode} />
            <div className="common-auth-section-left-wrapper-grid">
              <form action="." method="get" autoComplete="off">
                {isGettingConfigs ? (
                  <div className="loader-wrapper">
                    <ShowLoading />
                  </div>
                ) : (
                  <div className="common-auth-container-wrapper">
                    <h2 className="common-auth-section-header org-invite-header" data-cy="invite-page-header">
                      Join {configs?.name ? configs?.name : whiteLabelText}
                    </h2>

                    <div className="invite-sub-header" data-cy="invite-page-sub-header">
                      {`You are invited to ${
                        configs?.name
                          ? `a workspace ${configs?.name}. Accept the invite to join the workspace.`
                          : `${whiteLabelText}.`
                      }`}
                    </div>

                    <div className="org-page-inputs-wrapper">
                      <label className="tj-text-input-label" data-cy="name-input-label">
                        {t('verificationSuccessPage.name', 'Name')}
                      </label>
                      <p className="tj-text-input onbaording-disabled-field" data-cy="invited-user-name">
                        {userDetails?.name}
                      </p>
                    </div>

                    <div className="signup-inputs-wrap">
                      <label className="tj-text-input-label" data-cy="email-input-label">
                        {t('verificationSuccessPage.workEmail', 'Email')}
                      </label>
                      <p className="tj-text-input onbaording-disabled-field" data-cy="invited-user-email">
                        {userDetails?.email}
                      </p>
                    </div>

                    {userDetails?.onboarding_details?.password && source !== 'sso' && (
                      <div className="mb-3">
                        <label className="form-label" data-cy="password-label">
                          {t('verificationSuccessPage.password', 'Password')}
                        </label>
                        <div className="org-password">
                          <input
                            onChange={handleChange}
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            className="tj-text-input"
                            placeholder="Enter password"
                            autoComplete="new-password"
                            data-cy="password-input-field"
                          />

                          <div className="org-password-hide-img" onClick={handleOnCheck} data-cy="show-password-icon">
                            {showPassword ? (
                              <EyeHide
                                fill={
                                  darkMode
                                    ? password?.length
                                      ? '#D1D5DB'
                                      : '#656565'
                                    : password?.length
                                    ? '#384151'
                                    : '#D1D5DB'
                                }
                              />
                            ) : (
                              <EyeShow
                                fill={
                                  darkMode
                                    ? password?.length
                                      ? '#D1D5DB'
                                      : '#656565'
                                    : password?.length
                                    ? '#384151'
                                    : '#D1D5DB'
                                }
                              />
                            )}
                          </div>
                          <span className="tj-input-helper-text" data-cy="password-helper-text">
                            {t('loginSignupPage.passwordCharacter', 'Password must be at least 5 characters')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <ButtonSolid
                        className="org-btn login-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          userDetails?.onboarding_details?.password && userDetails?.onboarding_details?.questions
                            ? (setShowOnboarding(true), setShowJoinWorkspace(false))
                            : setUpAccount(e);
                        }}
                        disabled={
                          isLoading ||
                          (source !== 'sso' &&
                            userDetails?.onboarding_details?.password &&
                            (password?.length < 5 || password?.trim()?.length === 0 || !password))
                        }
                        data-cy="accept-invite-button"
                      >
                        {isLoading ? (
                          <div className="spinner-center">
                            <Spinner />
                          </div>
                        ) : (
                          <>
                            <span>{t('verificationSuccessPage.acceptInvite', 'Accept invite')}</span>
                            <EnterIcon className="enter-icon-onboard" fill={'#fff'} />
                          </>
                        )}
                      </ButtonSolid>
                    </div>
                    {defaultState && (
                      <p className="verification-terms" data-cy="signup-terms-helper">
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
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {verifiedToken && !showOnboarding && !showJoinWorkspace && source !== 'sso' && (
        <div className="page common-auth-section-whole-wrapper verification-success-nav-wrapper">
          <OnboardingNavbar darkMode={darkMode} />
          <div className="info-screen-outer-wrap verification-success-nav-wrapper-content">
            <div className="info-screen-wrapper">
              <div className="verification-success-card">
                <img
                  className="info-screen-email-img"
                  src={
                    darkMode
                      ? 'assets/images/onboardingassets/Illustrations/verification_successfull_dark.svg'
                      : 'assets/images/onboardingassets/Illustrations/verification_successfull.svg'
                  }
                  alt="email image"
                  loading="lazy"
                  data-cy="email-image"
                />
                <h1 className="common-auth-section-header" data-cy="onboarding-page-header">
                  {t('verificationSuccessPage.successfullyVerifiedEmail', 'Successfully verified email')}
                </h1>
                <p className="info-screen-description" data-cy="onboarding-page-description">
                  Continue to set up your workspace to start using {whiteLabelText}.
                </p>
                <ButtonSolid
                  className="verification-success-info-btn "
                  variant="primary"
                  onClick={(e) => {
                    clickContinue(e);
                  }}
                  data-cy="setup-tooljet-button"
                >
                  {isLoading ? (
                    <div className="spinner-center">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      {t('verificationSuccessPage.setupTooljet', `Set up ${whiteLabelText}`, {
                        whiteLabelText,
                      })}

                      <EnterIcon fill={'#fff'}></EnterIcon>
                    </>
                  )}
                </ButtonSolid>
              </div>
            </div>
          </div>
        </div>
      )}

      {verifiedToken && showOnboarding && (
        <OnBoardingForm
          userDetails={userDetails}
          token={params?.token}
          organizationToken={organizationToken}
          password={password}
          darkMode={darkMode}
          source={source}
        />
      )}

      {fallBack && (
        <div className="page">
          <OnboardingNavbar darkMode={darkMode} />
          <div className="link-expired-info-wrapper">
            <div className="info-screen-outer-wrap">
              <LinkExpiredInfoScreen />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
