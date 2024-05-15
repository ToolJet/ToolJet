import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectTo } from '@/_helpers/routes';
import { ToolTip } from '@/_components';
import cx from 'classnames';
import SSO from './icons/SSO';

export default function LdapSSOLoginButton({
  organizationSlug,
  name,
  featureIncluded,
  bannerMessage,
  buttonText,
  setSignupOrganizationDetails,
}) {
  const navigate = useNavigate();

  const redirectToLdapPage = (e) => {
    e.preventDefault();
    const redirectPath = getRedirectTo();
    setSignupOrganizationDetails && setSignupOrganizationDetails();
    organizationSlug && navigate(`/ldap/${organizationSlug}${redirectPath ? `?redirectTo=${redirectPath}` : ''}`);
  };
  return (
    <ToolTip message={bannerMessage} show={!featureIncluded}>
      <div
        className={cx({
          'sso-btn-disabled': !featureIncluded,
        })}
        data-cy="ldap-tile"
      >
        <div className="login-sso-wrapper">
          <div
            onClick={redirectToLdapPage}
            className="d-flex border-0 sso-button rounded-2 align-items-center cursor-pointer"
          >
            <SSO disabled={!featureIncluded} />
            <span data-cy="ldap-sso-text" className="sso-info-text">{`${buttonText} ${name || 'LDAP'}`}</span>
          </div>
        </div>
      </div>
    </ToolTip>
  );
}
