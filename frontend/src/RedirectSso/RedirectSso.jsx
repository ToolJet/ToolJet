import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { useTranslation } from 'react-i18next';

export const RedirectSso = function RedirectSso() {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const { t } = useTranslation();

  const [organization, setOrganization] = useState([]);
  const [googlessoEnabled, setGoogleSsoEnabled] = useState(false);
  const [gitSsoEnabled, setGitSsoEnabled] = useState(false);

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    if (isSingleOrganization) {
      authenticationService.getOrganizationConfigs().then((data) => {
        setOrganization(data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(organization);
    organization &&
      Object.keys(organization).map((item) => {
        if (item == 'google') setGoogleSsoEnabled(true);
        if (item == 'git') setGitSsoEnabled(true);
      });
  }, [organization]);

  return (
    <div>
      <div className="page page-center">
        <div className=" py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="assets/images/logo-color.svg" height="26" alt="" />
            </a>
          </div>
          <div className="sso-helper-container">
            <h2 className="sso-helper-header">
              <span className="gg-album"></span>
              {t('redirectSso.upgradingTov1.13.0', 'Upgrading to v1.13.0 and above.')}
            </h2>
            <p className="sso-helper-doc">
              {t('redirectSso.fromV1.13.0', 'From v1.13.0 we have introduced')}
              <a style={{ marginLeft: '4px' }} href="https://docs.tooljet.com/docs/tutorial/multiworkspace">
                {t('redirectSso.multiWorkspace', 'Multi-Workspace')}
              </a>
              .{' '}
              {t(
                'redirectSso.singleSignOnConfig',
                'The Single Sign-On related configurations are moved from environment variables to database. Please refer this'
              )}
              <a
                style={{ marginLeft: '4px', marginRight: '4px' }}
                href="https://docs.tooljet.com/docs/category/single-sign-on"
              >
                {t('redirectSso.link', 'Link')}
              </a>
              {t('redirectSso.toConfigureSSO', 'to configure SSO.')}
              <br />
              <li>
                {t(
                  'redirectSso.haveGoogleGithubSSo',
                  'If you have Google or GitHub SSO configurations before upgrade and disabled Multi-Workspace, then theSSO configurations will be migrated while upgrade but you have to re-configure the redirect URL in the SSO provider side. Redirect URLs for each SSO are given below.1'
                )}
                <br />
              </li>
              <li>
                {t(
                  'redirectSso.isMultiWorkspaceEnabled',
                  'If you have enabled Multi-Workspace, then the SSO configurations will not be migrated while upgrade so you have to re-configure the SSO under the respective workspace.1'
                )}
              </li>
            </p>
            <div className="sso-content-wrapper">
              {!isSingleOrganization ? (
                <>
                  <div>
                    <p className="workspace-status">
                      {t('redirectSso.youHaveEnabled', 'You have Enabled')}
                      <a style={{ marginLeft: '4px' }} href="https://docs.tooljet.com/docs/tutorial/multiworkspace">
                        {t('redirectSso.multiWorkspace', 'Multi-Workspace')}
                      </a>
                    </p>
                    <p>
                      {t(
                        'redirectSso.setupSsoWorkspace',
                        'Please login with password and you can setup sso using workspace'
                      )}
                      <a
                        href="https://docs.tooljet.com/docs/user-authentication/general-settings"
                        style={{ marginLeft: '4px' }}
                      >
                        {t('redirectSso.manageSsoMenu', 'Manage SSO menu.')}
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="workspace-status">
                      {' '}
                      <span className="gg-border-all"></span>
                      {t('redirectSso.youHaveDisabled', 'You have Disabled')}
                      <a style={{ marginLeft: '4px' }} href="https://docs.tooljet.com/docs/tutorial/multiworkspace">
                        {t('redirectSso.multiWorkspace', 'Multi-Workspace')}
                      </a>
                    </p>
                  </div>
                </>
              )}
              <div>
                {isSingleOrganization && (
                  <>
                    <div>
                      {googlessoEnabled || gitSsoEnabled ? (
                        <p>
                          {t('redirectSso.configureRedirectUrl', 'Please configure redirect url in SSO provider side.')}
                        </p>
                      ) : (
                        <p>
                          {t(
                            'redirectSso.setupSsoWorkspace',
                            'Please login with password and you can setup sso using workspace'
                          )}
                          <a
                            style={{ marginLeft: '4px' }}
                            href="https://docs.tooljet.com/docs/user-authentication/general-settings"
                          >
                            {t('redirectSso.manageSsoMenu', 'Manage SSO menu.')}
                          </a>
                        </p>
                      )}
                      {googlessoEnabled && (
                        <>
                          <p className="sso-type">
                            <span className="">-</span>
                            {t('redirectSso.google', 'Google')} :{' '}
                            <a href="https://docs.tooljet.com/docs/sso/google"> {t('redirectSso.link', 'Link')}</a>
                          </p>
                          <div className="flexer">
                            <span> {t('redirectSso.redirectUrl', 'Redirect URL:')} </span>
                            <p id="google-url">{`${window.public_config?.TOOLJET_HOST}/sso/google/${organization?.google?.config_id}`}</p>

                            <img
                              onClick={() => copyFunction('google-url')}
                              src={`assets/images/icons/copy.svg`}
                              width="16"
                              height="16"
                              className="sso-copy"
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      {gitSsoEnabled && (
                        <>
                          <p className="sso-type ">
                            <span className="">-</span>
                            {t('redirectSso.gitHub', 'GitHub')} :{' '}
                            <a href="https://docs.tooljet.com/docs/sso/github"> {t('redirectSso.link', 'Link')}</a>
                          </p>

                          <div className="flexer">
                            <span> {t('redirectSso.redirectUrl', 'Redirect URL:')}</span>
                            <p id="git-url">{`${window.public_config?.TOOLJET_HOST}/sso/git/${organization?.git?.config_id}`}</p>

                            <img
                              onClick={() => copyFunction('git-url')}
                              src={`assets/images/icons/copy.svg`}
                              width="16"
                              height="16"
                              className="sso-copy"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
