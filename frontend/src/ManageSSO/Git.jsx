import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Toggle from '@/_ui/Toggle/index';

export function Git({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [hostName, setHostName] = useState(settings?.configs?.host_name || '');
  const [clientSecret, setClientSecret] = useState(settings?.configs?.client_secret || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const { t } = useTranslation();

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
    setClientSecret(settings?.configs?.client_secret || '');
    setHostName(settings?.configs?.host_name || '');
  };

  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };
  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'git', configs: { clientId, clientSecret, hostName } }).then(
      (data) => {
        setSaving(false);
        data.id && setConfigId(data.id);
        updateData('git', {
          id: data.id,
          configs: { client_id: clientId, client_secret: clientSecret, host_name: hostName },
        });
        toast.success('updated SSO configurations', {
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

  const changeStatus = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'git', enabled: !enabled }).then(
      (data) => {
        setSaving(false);
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        data.id && setConfigId(data.id);
        updateData('git', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} GitHub SSO`, {
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

  return (
    <div className="sso-card-wrapper">
      <div className="card-header">
        <div className="d-flex justify-content-between title-with-toggle">
          <div>
            <Toggle
              label={t('header.organization.menus.manageSSO.github.title', 'Github')}
              onChange={changeStatus}
              checked={enabled}
              dataCy="github"
            />
          </div>
          <div className="card-title">
            <span className={` tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
              {enabled ? t('globals.enabled', 'Enabled') : t('globals.disabled', 'Disabled')}
            </span>
          </div>
        </div>
      </div>
      <div className="card-body">
        <form noValidate className="sso-form-wrap">
          <div className="form-group mb-3">
            <label className="form-label" data-cy="host-name-label">
              {t('header.organization.menus.manageSSO.github.hostName', 'Host Name')}
            </label>
            <div className="tj-app-input">
              <input
                type="text"
                className="form-control"
                placeholder={t('header.organization.menus.manageSSO.github.enterHostName', 'Enter Host Name')}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                data-cy="host-name-input"
              />
            </div>
            <div>
              <div data-cy="git-sso-help-text" className=" tj-text-xxsm git-sso-help-text">
                {t('header.organization.menus.manageSSO.github.requiredGithub', 'Required if GitHub is self hosted')}
              </div>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="client-id-label">
              {t('header.organization.menus.manageSSO.github.clientId', ' Client Id')}
            </label>
            <div className="tj-app-input">
              <input
                type="text"
                className="form-control"
                placeholder={t('header.organization.menus.manageSSO.github.enterClientId', 'Enter Client Id')}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                data-cy="client-id-input"
              />
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="client-secret-label">
              {t('header.organization.menus.manageSSO.github.clientSecret', 'Client Secret')}
              <small className="git- mx-2" data-cy="encripted-label">
                <SolidIcon name="lock" width="16" />
                {t('header.organization.menus.manageSSO.github.encrypted', 'Encrypted')}
              </small>
            </label>
            <div className="tj-app-input">
              <input
                type="text"
                className="form-control"
                placeholder={t('header.organization.menus.manageSSO.github.enterClientSecret', 'Enter Client Secret')}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                data-cy="client-secret-input"
              />
            </div>
          </div>
          {configId && (
            <div className="form-group mb-3">
              <label className="form-label" data-cy="redirect-url-label">
                {t('header.organization.menus.manageSSO.github.redirectUrl', 'Redirect URL')}
              </label>
              <div className="d-flex justify-content-between tj-input-element align-items-center">
                <p data-cy="redirect-url" id="redirect-url">{`${window.public_config?.TOOLJET_HOST}${
                  window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                }sso/git/${configId}`}</p>
                <SolidIcon name="copy" width="16" onClick={() => copyFunction('redirect-url')} />
              </div>
            </div>
          )}
        </form>
      </div>
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
          {t('globals.savechanges', 'Save changes')}
        </ButtonSolid>
      </div>
    </div>
  );
}
