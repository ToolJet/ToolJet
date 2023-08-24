import React, { useState, useEffect } from 'react';
import { withTranslation } from 'react-i18next';
import EyeHide from '../../assets/images/onboardingassets/Icons/EyeHide';
import EyeShow from '../../assets/images/onboardingassets/Icons/EyeShow';
import Spinner from '@/_ui/Spinner';
import { ButtonSolid } from '@/_components/AppButton';
import OnboardingNavbar from '@/_components/OnboardingNavbar';
import { authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { getSubpath, returnWorkspaceIdIfNeed, eraseRedirectUrl } from '@/_helpers/utils';

const LdapLoginPageComponent = ({ darkMode, ...props }) => {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState({});
  const [isGettingConfigs, setGettingConfigsState] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { organizationId } = useParams();

  const handleChange = (event) => {
    switch (event.target.name) {
      case 'username':
        setUserName(event.target.value);
        break;
      case 'password':
        setPassword(event.target.value);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setGettingConfigsState(true);
    authenticationService.deleteLoginOrganizationId();
    authenticationService.getOrganizationConfigs(organizationId).then(
      (configs) => {
        if (!configs?.ldap?.enabled) {
          return props.navigate(`/login${organizationId} ? '/${organizationId} ? ''`);
        }
        setConfig(configs?.ldap);
        setGettingConfigsState(false);
      },
      (error) => {
        //TODO-muhsin: add specific error messages
        toast.error(error?.data?.message || 'Error while fetaching ldap details. Please try again');
        if (error.data.statusCode !== 404) {
          setGettingConfigsState(false);
          return props.navigate('/login');
        } else {
          return props.navigate('/setup');
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = () => {
    if (username && password) {
      setLoading(true);
      authenticationService
        .signInViaOAuth(config?.config_id, 'ldap', { username, password, organizationId })
        .then(({ redirect_url, organization_id }) => {
          if (redirect_url) {
            window.location.href = redirect_url;
            return;
          }
          setLoading(false);
          const path = eraseRedirectUrl();
          const redirectPath = `${returnWorkspaceIdIfNeed(path, organization_id)}${path && path !== '/' ? path : ''}`;
          window.location = getSubpath() ? `${getSubpath()}${redirectPath}` : redirectPath;
        })
        .catch((err) => {
          toast.error(`LDAP login failed - ${err?.error || 'something went wrong'}`);
          setLoading(false);
        });
    }
  };

  const handleOnCheck = () => {
    setShowPassword(!showPassword);
  };

  const btnDisabledState = isGettingConfigs || isLoading || !password || !username || username.trim().length === 0;

  return (
    <div className="page common-auth-section-whole-wrapper ldap-login-page">
      <div className="common-auth-section-left-wrapper">
        <OnboardingNavbar darkMode={darkMode} />

        <div className="common-auth-section-left-wrapper-grid">
          <div className="common-auth-container-wrapper common-auth-signup-container-wrapper">
            <div className="signup-page-inputs-wrapper">
              <div className="d-flex flex-column align-items-center gap-1 ldap-login-header">
                <svg
                  width="60"
                  height="60"
                  viewBox="0 0 60 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  data-cy="key-logo"
                >
                  <rect width="60" height="60" rx="6" fill="#F0F4FF" />
                  <path
                    d="M41.498 18H38.4983C38.4327 17.9992 38.3677 18.0122 38.3074 18.038C38.2471 18.0638 38.1929 18.102 38.1483 18.15L28.6192 27.68C27.0202 26.9483 25.2149 26.802 23.5189 27.2664C21.8229 27.7308 20.344 28.7764 19.3407 30.2206C18.3373 31.6648 17.8733 33.4157 18.0297 35.1673C18.1862 36.9189 18.9531 38.5598 20.1965 39.8033C21.4399 41.0468 23.0807 41.8138 24.8321 41.9702C26.5836 42.1267 28.3343 41.6627 29.7784 40.6592C31.2225 39.6558 32.268 38.1768 32.7324 36.4806C33.1968 34.7845 33.0504 32.9791 32.3188 31.3799L34.6386 29.0699L36.5685 29.7199C36.7369 29.7807 36.9185 29.7951 37.0944 29.7617C37.2703 29.7283 37.434 29.6482 37.5684 29.5299C37.6977 29.4197 37.7968 29.2782 37.8563 29.119C37.9157 28.9598 37.9337 28.788 37.9083 28.6199L37.5084 26.2L38.2283 25.47L39.6882 26.14C39.8581 26.2154 40.0456 26.242 40.2298 26.2168C40.414 26.1915 40.5875 26.1154 40.7308 25.997C40.8742 25.8786 40.9816 25.7226 41.0412 25.5464C41.1008 25.3703 41.1101 25.1811 41.068 25L40.5581 23.19L41.848 21.89C41.9013 21.841 41.9427 21.7802 41.9687 21.7126C41.9947 21.6449 42.0047 21.5722 41.9979 21.5V18.5C41.9979 18.3674 41.9453 18.2402 41.8515 18.1465C41.7578 18.0527 41.6306 18 41.498 18ZM24.9995 36.4999C24.9995 36.7965 24.9116 37.0866 24.7468 37.3332C24.5819 37.5799 24.3477 37.7722 24.0736 37.8857C23.7996 37.9992 23.498 38.0289 23.2071 37.971C22.9161 37.9132 22.6489 37.7703 22.4391 37.5605C22.2293 37.3507 22.0865 37.0835 22.0286 36.7925C21.9707 36.5015 22.0005 36.1999 22.114 35.9259C22.2275 35.6518 22.4197 35.4175 22.6664 35.2527C22.913 35.0879 23.203 34.9999 23.4997 34.9999C23.8975 34.9999 24.2789 35.1579 24.5602 35.4392C24.8415 35.7205 24.9995 36.1021 24.9995 36.4999Z"
                    fill="#3E63DD"
                  />
                </svg>
                <h2 className="common-auth-section-header text-center" data-cy="ldap-page-header">{`Sign in with ${
                  config?.configs?.name ?? 'LDAP'
                }`}</h2>
              </div>

              <div className="ldap-form">
                <div>
                  <label className="tj-text-input-label" data-cy="user-name-input-label">
                    Username
                  </label>
                  <input
                    onChange={handleChange}
                    name="username"
                    type="text"
                    className="tj-text-input"
                    placeholder={props.t('ldapLoginPage.enterUsername', 'Enter your username')}
                    data-cy="name-input-field"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="tj-text-input-label" data-cy="password-label">
                    Password
                  </label>
                  <div className="login-password signup-password-wrapper">
                    <input
                      onChange={handleChange}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="tj-text-input"
                      placeholder={props.t('ldapLoginPage.enterPassword', 'Enter password')}
                      data-cy="password-input-field"
                      autoComplete="new-password"
                    />
                    <div className="signup-password-hide-img" onClick={handleOnCheck} data-cy="show-password-icon">
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
                  </div>
                </div>

                <div>
                  <ButtonSolid
                    className="signup-btn"
                    onClick={signIn}
                    disabled={btnDisabledState}
                    data-cy="sign-up-button"
                  >
                    {isLoading ? (
                      <div className="spinner-center">
                        <Spinner />
                      </div>
                    ) : (
                      <>
                        <span>{props.t('ldapLoginPage.sigin', 'Sign in')}</span>
                        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M17.0649 5.34566C17.423 5.70376 17.423 6.29646 17.0649 6.65455L12.1257 11.5937C11.7677 11.9518 11.1749 11.9518 10.8169 11.5937C10.4588 11.2356 10.4588 10.6429 10.8169 10.2849L14.1755 6.9262L1.59293 6.92621C1.08666 6.92621 0.66683 6.50637 0.66683 6.00011C0.66683 5.49384 1.08666 5.07401 1.59293 5.07401L14.1755 5.07401L10.8169 1.71536C10.4588 1.35727 10.4588 0.764569 10.8169 0.406478C11.1749 0.0483871 11.7677 0.0483871 12.1257 0.406478L17.0649 5.34566Z"
                            fill="#C1C8CD"
                          />
                        </svg>
                      </>
                    )}
                  </ButtonSolid>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LdapLoginPage = withTranslation()(LdapLoginPageComponent);
