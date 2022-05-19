import React, { useState, useEffect } from 'react';
import { organizationService } from '@/_services';

export const RedirectSso = function RedirectSso() {
  // const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const [organization, setOrganization] = useState();

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    organizationService.getSSODetails().then((data) => {
      setOrganization(data.organization_details);
    });
  }, []);

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
            <h2>SSO Login Information</h2>
            <div>
              <h3>Google SSO</h3>
              <p>
                Please verify Google SSO configuration here :{' '}
                <a href="https://docs.tooljet.com/docs/sso/google">Google SSO configuratios</a>
              </p>
              <div className="flexer">
                <span> Redirect URL : </span>
                <p id="google-url">{`${window.location.protocol}//${window.location.host}/sso/google/${organization?.sso_configs?.[1]?.id}`}</p>

                <img
                  onClick={() => copyFunction('google-url')}
                  src={`/assets/images/icons/copy.svg`}
                  width="16"
                  height="16"
                  className="sso-copy"
                />
              </div>
            </div>
            <div>
              <h3>GitHub SSO</h3>
              <p>
                Please verify GitHub SSO configuration here :{' '}
                <a href="https://docs.tooljet.com/docs/sso/github">Git SSO configuratios</a>
              </p>
              <div className="flexer">
                <span> Redirect URL :</span>
                <p id="git-url">{`${window.location.protocol}//${window.location.host}/sso/git/${organization?.sso_configs?.[0]?.id}`}</p>

                <img
                  onClick={() => copyFunction('git-url')}
                  src={`/assets/images/icons/copy.svg`}
                  width="16"
                  height="16"
                  className="sso-copy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
