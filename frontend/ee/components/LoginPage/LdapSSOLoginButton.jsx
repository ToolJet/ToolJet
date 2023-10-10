import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationService } from '@/_services';

export default function LdapSSOLoginButton({ configs }) {
  const navigate = useNavigate();
  const organizationId = authenticationService.getLoginOrganizationId();
  const name = configs?.name;

  const redirectToLdapPage = (e) => {
    e.preventDefault();
    organizationId && navigate(`/ldap/${organizationId}`);
  };
  return (
    <div data-cy="ldap-tile">
      <div onClick={redirectToLdapPage} className="d-flex border-0 rounded-2 align-items-center cursor-pointer">
        <img src="assets/images/sso-buttons/sso-general.svg" className="h-4" data-cy="ldap-sso-icon" />
        <span data-cy="ldap-sso-text" className="sso-info-text">{`Sign in with ${name || 'LDAP'}`}</span>
      </div>
    </div>
  );
}
