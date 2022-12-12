import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';

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
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between title-with-toggle">
          <div className="card-title" data-cy="card-title">
            {t('header.organization.menus.manageSSO.github.title', 'Github')}
            <span className={`badge bg-${enabled ? 'green' : 'grey'} ms-1`} data-cy="status-label">
              {enabled ? t('globals.enabled', 'Enabled') : t('globals.disabled', 'Disabled')}
            </span>
          </div>
          <div>
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={enabled}
                onChange={changeStatus}
                data-cy="form-check-input"
              />
            </label>
          </div>
        </div>
      </div>
      <div className="card-body">
        <form noValidate>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="host-name-label">
              {t('header.organization.menus.manageSSO.github.hostName', 'Host Name')}
            </label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder={t('header.organization.menus.manageSSO.github.enterHostName', 'Enter Host Name')}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                data-cy="host-name-input"
              />
            </div>
            <div className="help-text mt-2">
              <div data-cy="git-sso-help-text">
                {' '}
                {t('header.organization.menus.manageSSO.github.requiredGithub', 'Required if GitHub is self hosted')}
              </div>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="client-id-label">
              {t('header.organization.menus.manageSSO.github.clientId', ' Client Id')}
            </label>
            <div>
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
              <small className="text-green mx-2" data-cy="encripted-label">
                <img className="mx-2 encrypted-icon" src="assets/images/icons/padlock.svg" width="12" height="12" />
                {t('header.organization.menus.manageSSO.github.encrypted', 'Encrypted')}
              </small>
            </label>
            <div>
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
              <div className="flexer-sso-input form-control">
                <p
                  data-cy="redirect-url"
                  id="redirect-url"
                >{`${window.public_config?.TOOLJET_HOST}/sso/git/${configId}`}</p>
                <img
                  onClick={() => copyFunction('redirect-url')}
                  src={`assets/images/icons/copy-dark.svg`}
                  width="22"
                  height="22"
                  className="sso-copy"
                />
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
