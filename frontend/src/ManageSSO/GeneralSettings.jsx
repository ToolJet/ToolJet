import { authenticationService, organizationService } from '@/_services';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';

export function GeneralSettings({ settings, updateData }) {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const [enableSignUp, setEnableSignUp] = useState(settings?.enable_sign_up || false);
  const [inheritSSO, setInheritSSO] = useState(settings?.inherit_s_s_o || false);
  const [domain, setDomain] = useState(settings?.domain || '');
  const [isSaving, setSaving] = useState(false);
  const { t } = useTranslation();

  const reset = () => {
    setEnableSignUp(settings?.enable_sign_up || false);
    setDomain(settings?.domain || '');
  };
  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganization({ enableSignUp, domain, inheritSSO }).then(
      () => {
        setSaving(false);
        updateData('general', { enable_sign_up: enableSignUp, domain, inherit_s_s_o: inheritSSO });
        toast.success('updated sso configurations', {
          position: 'top-center',
        });
      },
      () => {
        setSaving(false);
        toast.error('Error while saving SSO configurations', {
          position: 'top-center',
        });
      }
    );
  };

  const tickIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-tabler icon-tabler-check"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M5 12l5 5l10 -10"></path>
      </svg>
    );
  };

  const crossIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-tabler icon-tabler-x"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <line x1={18} y1={6} x2={6} y2={18}></line>
        <line x1={6} y1={6} x2={18} y2={18}></line>
      </svg>
    );
  };

  const ssoButtons = (type) => {
    return (
      <div className={`d-flex main-box ${inheritSSO ? 'tick' : 'cross'}-box`}>
        <div className="icon-box">{inheritSSO ? tickIcon() : crossIcon()}</div>
        <img width="35px" src={`assets/images/sso-buttons/${type}.svg`} />
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" data-cy="card-title">
          {t('header.organization.menus.manageSSO.generalSettings.title', 'General Settings')}
        </div>
      </div>
      <div className="card-body">
        <form noValidate>
          <div className="form-group mb-3">
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                onChange={() => setEnableSignUp((enableSignUp) => !enableSignUp)}
                checked={enableSignUp}
                data-cy="form-check-input"
              />
              <span className="form-check-label" data-cy="form-check-label">
                {t('header.organization.menus.manageSSO.generalSettings.enableSignup', 'Enable signup')}
              </span>
            </label>
            <div className="help-text">
              <div data-cy="general-settings-help-text">
                {t(
                  'header.organization.menus.manageSSO.generalSettings.newAccountWillBeCreated',
                  `New account will be created for user's first time SSO sign in`
                )}
              </div>
            </div>
          </div>
          {!isSingleOrganization &&
            (window.public_config?.SSO_GOOGLE_OAUTH2_CLIENT_ID || window.public_config?.SSO_GIT_OAUTH2_CLIENT_ID) && (
              <div className="form-group mb-3">
                <label className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    onChange={() => setInheritSSO((inheritSSO) => !inheritSSO)}
                    checked={inheritSSO}
                    data-cy="form-check-input"
                  />
                  <span className="form-check-label" data-cy="form-check-label">
                    {t('header.organization.menus.manageSSO.generalSettings.allowDefaultSso', `Allow default SSO`)}
                  </span>
                </label>
                <div className="d-flex tick-cross-info mb-2">
                  {window.public_config?.SSO_GOOGLE_OAUTH2_CLIENT_ID && ssoButtons('google')}
                  {window.public_config?.SSO_GIT_OAUTH2_CLIENT_ID && ssoButtons('git')}
                </div>
                <div className="help-text mt-1">
                  <div data-cy="login-help-text">
                    {t(
                      'header.organization.menus.manageSSO.generalSettings.ssoAuth',
                      `Allow users to authenticate via default SSO. Default SSO configurations can be overridden by workspace level SSO.`
                    )}
                  </div>
                </div>
              </div>
            )}
          <div className="form-group mb-3">
            <label className="form-label" data-cy="allowed-domains-label">
              {t('header.organization.menus.manageSSO.generalSettings.allowedDomains', `Allowed domains`)}
            </label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder={t('header.organization.menus.manageSSO.generalSettings.enterDomains', `Enter Domains`)}
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                data-cy="allowed-domain-input"
              />
            </div>
            <div className="help-text mt-1">
              <div data-cy="allowed-domain-help-text">
                {t(
                  'header.organization.menus.manageSSO.generalSettings.supportMultiDomains',
                  `Support multiple domains. Enter domain names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com`
                )}
              </div>
            </div>
          </div>
          {!isSingleOrganization && (
            <div className="form-group mb-3">
              <label className="form-label" data-cy="login-url-label">
                {t('header.organization.menus.manageSSO.generalSettings.loginUrl', `Login URL`)}
              </label>

              <div className="flexer-sso-input form-control">
                <p id="login-url" data-cy="login-url">
                  {`${window.public_config?.TOOLJET_HOST}/login/${authenticationService?.currentUserValue?.organization_id}`}
                </p>
                <img
                  onClick={() => copyFunction('login-url')}
                  src={`assets/images/icons/copy-dark.svg`}
                  width="22"
                  height="22"
                  className="sso-copy"
                />
              </div>
              <div className="help-text mt-1">
                <div data-cy="login-help-text">
                  {t(
                    'header.organization.menus.manageSSO.generalSettings.workspaceLogin',
                    `Use this URL to login directly to this workspace`
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="form-footer">
            <button type="button" className="btn btn-light mr-2" onClick={reset} data-cy="cancel-button">
              {t('globals.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className={`btn mx-2 btn-primary ${isSaving ? 'btn-loading' : ''}`}
              disabled={isSaving}
              onClick={saveSettings}
              data-cy="save-button"
            >
              {t('globals.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
