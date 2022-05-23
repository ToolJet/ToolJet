import React, { useState, useEffect } from 'react';
import { organizationService } from '@/_services';

export const RedirectSso = function RedirectSso() {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';

  const [organization, setOrganization] = useState();
  const [googlessoEnabled, setGoogleSsoEnabled] = useState(false);
  const [gitSsoEnabled, setGitSsoEnabled] = useState(false);

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    organizationService.getPublicSSODetails().then((data) => {
      setOrganization(data.organization_details);
    });
  }, []);

  useEffect(() => {
    organization?.sso_configs.map((item) => {
      if (item.enabled == true) {
        if (item.sso == 'google') setGoogleSsoEnabled(true);
        if (item.sso == 'git') setGitSsoEnabled(true);
      }
    });
  }, [organization]);

  return (
    <div>
      <div className="page page-center">
        <div className=" py-2">
          <div className="text-center mb-4">
            <a href="." className="navbar-brand-autodark">
              <img src="/assets/images/logo-color.svg" height="26" alt="" />
            </a>
          </div>
          <div className="sso-helper-container">
            <h2>Upgrade to version 1.30.0 and above.</h2>
            {!isSingleOrganization ? (
              <>
                <p>
                  You have Enabled
                  <a style={{ marginLeft: '4px' }} href="https://docs.tooljet.com/docs/multiworkspace">
                    Multi-Workspace
                  </a>
                </p>
                <p>Please login with password and you can setup sso using workspace Manage SSO menu. </p>
              </>
            ) : (
              <>
                <p>
                  You have Disabled Multi-Workspace.
                  <a style={{ marginLeft: '4px' }} href="https://docs.tooljet.com/docs/multiworkspace">
                    Link
                  </a>
                </p>
                <p> Please configure SSO using Manage SSO menu.</p>
              </>
            )}
            {!isSingleOrganization && (
              <>
                <p>If You have enabled SSO for your workspaces, please re-configure</p>
                <div>
                  <p>
                    <span className="sso-type"> Google:</span>
                    <a href="https://docs.tooljet.com/docs/sso/google"> Link</a>
                  </p>
                  {googlessoEnabled && (
                    <div className="flexer">
                      <span> Google: </span>
                      <p id="google-url">{`${window.location.protocol}//${window.location.host}/sso/google/${organization?.sso_configs?.[1]?.id}`}</p>

                      <img
                        onClick={() => copyFunction('google-url')}
                        src={`/assets/images/icons/copy.svg`}
                        width="16"
                        height="16"
                        className="sso-copy"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p>
                    <span className="sso-type"> Git:</span>
                    <a href="https://docs.tooljet.com/docs/sso/github"> Link</a>
                  </p>
                  {gitSsoEnabled && (
                    <div className="flexer">
                      <span> Git :</span>
                      <p id="git-url">{`${window.location.protocol}//${window.location.host}/sso/git/${organization?.sso_configs?.[0]?.id}`}</p>

                      <img
                        onClick={() => copyFunction('git-url')}
                        src={`/assets/images/icons/copy.svg`}
                        width="16"
                        height="16"
                        className="sso-copy"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
