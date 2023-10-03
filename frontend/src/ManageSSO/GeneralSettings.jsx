import { authenticationService, organizationService } from '@/_services';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { ConfirmDialog } from '@/_components';

export function GeneralSettings({ settings, updateData, instanceSettings, darkMode }) {
  const [enableSignUp, setEnableSignUp] = useState(settings?.enable_sign_up || false);
  const [inheritSSO, setInheritSSO] = useState(settings?.inherit_s_s_o || false);
  const [domain, setDomain] = useState(settings?.domain || '');
  const [isSaving, setSaving] = useState(false);
  const { t } = useTranslation();
  const passwordSettings = settings?.sso_configs?.find((obj) => obj.sso === 'form');
  const [enabled, setEnabled] = useState(passwordSettings?.enabled || false);
  const [showDisablingPasswordConfirmation, setShowDisablingPasswordConfirmation] = useState(false);

  const changeStatus = () => {
    organizationService.editOrganizationConfigs({ type: 'form', enabled: !enabled }).then(
      (data) => {
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        updateData('form', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} Password login`, { position: 'top-center' });
        setShowDisablingPasswordConfirmation(false);
      },
      () => {
        toast.error('Error while saving SSO configurations', {
          position: 'top-center',
        });
      }
    );
  };

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
      (err) => {
        setSaving(false);
        toast.error(err?.data?.message || 'Error while saving SSO configurations', {
          position: 'top-center',
        });
      }
    );
  };

  const ssoButtons = (type) => {
    return (
      <div className={`d-flex`}>
        <img width="35px" src={`assets/images/sso-buttons/${type}.svg`} />
      </div>
    );
  };

  return (
    <div className="sso-card-wrapper">
      <div className="card-header">
        <div className="card-title" data-cy="card-title">
          {t('header.organization.menus.manageSSO.generalSettings.title', 'General Settings')}
        </div>
      </div>
      <div className="card-body">
        <form noValidate className="sso-form-wrap">
          <div className="form-group mb-3">
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                onChange={() => setEnableSignUp((enableSignUp) => !enableSignUp)}
                checked={enableSignUp}
                data-cy="enable-sign-up-toggle"
              />
              <span className="form-check-label" data-cy="enable-sign-up-label">
                {t('header.organization.menus.manageSSO.generalSettings.enableSignup', 'Enable signup')}
              </span>
            </label>
            <div className="help-text">
              <div data-cy="enable-sign-up-helper-text">
                {t(
                  'header.organization.menus.manageSSO.generalSettings.newAccountWillBeCreated',
                  `New account will be created for user's first time SSO sign in`
                )}
              </div>
            </div>
          </div>
          {(instanceSettings.google.enabled || instanceSettings.git.enabled) && (
            <div className="form-group mb-3">
              <label className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  onChange={() => setInheritSSO((inheritSSO) => !inheritSSO)}
                  checked={inheritSSO}
                  data-cy="allow-default-sso-toggle"
                />
                <span className="form-check-label" data-cy="allow-default-sso-label">
                  {t('header.organization.menus.manageSSO.generalSettings.allowDefaultSso', `Allow default SSO`)}
                </span>
              </label>
              <div className="help-text tj-text-xsm mt-1">
                <div data-cy="allow-default-sso-helper-text" className="allow-default-sso-helper-text tj-text-xsm mt">
                  {t(
                    'header.organization.menus.manageSSO.generalSettings.ssoAuth',
                    `Allow users to authenticate via default SSO. Default SSO configurations can be overridden by workspace level SSO.`
                  )}
                </div>
              </div>
              <div className="d-flex sso-icon-wrapper mb-2" data-cy="default-sso-status-image">
                <SolidIcon
                  fill={inheritSSO ? '#fff' : '#889096'}
                  name={inheritSSO ? 'tick' : 'removerectangle'}
                  className={inheritSSO && `tick-icon`}
                />
                <p className="tj-text-xsm mr-3 default-option-text">Default options</p>
                <div className="d-flex sso-main-box">
                  {instanceSettings.google.enabled && ssoButtons('google')}
                  {instanceSettings.git.enabled && ssoButtons('git')}
                </div>
              </div>
            </div>
          )}
          <div className="form-group tj-app-input">
            <label className="form-label" data-cy="allowed-domains-label">
              {t('header.organization.menus.manageSSO.generalSettings.allowedDomains', `Allowed domains`)}
            </label>
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
          <div className="tj-text-xxsm mb-3">
            <div data-cy="allowed-domain-helper-text">
              {t(
                'header.organization.menus.manageSSO.generalSettings.supportMultiDomains',
                `Support multiple domains. Enter domain names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com`
              )}
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="workspace-login-url-label">
              {t('header.organization.menus.manageSSO.generalSettings.loginUrl', `Login URL`)}
            </label>

            <div className="d-flex justify-content-between form-control align-items-center">
              <p id="login-url" data-cy="workspace-login-url">
                {`${window.public_config?.TOOLJET_HOST}${
                  window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                }/login/${
                  authenticationService?.currentSessionValue?.current_organization_slug ||
                  authenticationService?.currentSessionValue?.current_organization_id
                }`}
              </p>
              <SolidIcon name="copy" width="16" onClick={() => copyFunction('login-url')} />
            </div>
            <div className="mt-1 tj-text-xxsm">
              <div data-cy="workspace-login-help-text">
                {t(
                  'header.organization.menus.manageSSO.generalSettings.workspaceLogin',
                  `Use this URL to login directly to this workspace`
                )}
              </div>
            </div>
          </div>

          <ConfirmDialog
            show={showDisablingPasswordConfirmation}
            message={t(
              'manageSSO.DisablingPasswordConfirmation',
              'Users won’t be able to login via username and password if password login is disabled. Please make sure that you have setup other authentication methods before disabling password login, do you want to continue?'
            )}
            onConfirm={() => changeStatus()}
            onCancel={() => setShowDisablingPasswordConfirmation(false)}
            darkMode={darkMode}
          />
          <div className="password-disable-danger-wrap">
            <div className="default-danger-tag-wrap">
              <SolidIcon name="information" fill="#E54D2E" width="13" />
              <p className="font-weight-500 tj-text-xsm" data-cy="alert-text">
                Danger zone
              </p>
            </div>
            <div className="form-group mb-3">
              <label className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  onChange={() => (enabled ? setShowDisablingPasswordConfirmation(true) : changeStatus())}
                  data-cy="password-enable-toggle"
                  checked={enabled}
                />
                <span className="form-check-label" data-cy="label-password-login">
                  Password login{' '}
                </span>
              </label>
              <div className="help-text tj-text-xsm danger-text-login">
                <div data-cy="disable-password-helper-text">
                  Disable password login only if your SSO is configured otherwise you will get logged out.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <ConfirmDialog />
      <div className="form-footer sso-card-footer">
        <ButtonSolid onClick={reset} data-cy="cancel-button" variant="tertiary" className="sso-footer-cancel-btn">
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>

        <ButtonSolid
          disabled={isSaving}
          isLoading={isSaving}
          onClick={saveSettings}
          data-cy="save-button"
          variant="primary"
          className="sso-footer-save-btn"
          leftIcon="floppydisk"
          fill="#fff"
          iconWidth="20"
        >
          {t('globals.savechanges', 'Save')}
        </ButtonSolid>
      </div>
    </div>
  );
}
