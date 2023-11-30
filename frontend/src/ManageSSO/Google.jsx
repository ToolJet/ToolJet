import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { copyToClipboard } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export function Google({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);
  const { t } = useTranslation();

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
  };
  const copyFunction = (input) => {
    let text = document.getElementById(input).innerHTML;
    copyToClipboard(text);
  };
  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'google', configs: { clientId } }).then(
      (data) => {
        setSaving(false);
        data.id && setConfigId(data.id);
        updateData('google', { id: data.id, configs: { client_id: clientId } });
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
    organizationService.editOrganizationConfigs({ type: 'google', enabled: !enabled }).then(
      (data) => {
        setSaving(false);
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        data.id && setConfigId(data.id);
        updateData('google', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} Google SSO`, {
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
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={enabled}
                onChange={changeStatus}
                data-cy="google-enable-toggle"
              />
              <span className="sso-type-header" data-cy="card-title">
                {t('header.organization.menus.manageSSO.google.title', 'Google')}
              </span>
            </label>
          </div>

          <div className="card-title">
            <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
              {enabled
                ? t('header.organization.menus.manageSSO.google.enabled', 'Enabled')
                : t('header.organization.menus.manageSSO.google.disabled', 'Disabled')}
            </span>
          </div>
        </div>
      </div>
      <div className="card-body">
        <form noValidate className="sso-form-wrap">
          <div className="form-group mb-3">
            <label className="form-label" data-cy="client-id-label">
              {t('header.organization.menus.manageSSO.google.clientId', 'Client Id')}
            </label>
            <div className="tj-app-input">
              <input
                type="text "
                className="form-control"
                placeholder={t('header.organization.menus.manageSSO.google.enterClientId', 'Enter Client Id')}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                data-cy="client-id-input"
              />
            </div>
          </div>
          {configId && (
            <div className="form-group mb-3">
              <label className="form-label" data-cy="redirect-url-label">
                {t('header.organization.menus.manageSSO.google.redirectUrl', 'Redirect URL')}
              </label>
              <div className="d-flex justify-content-between tj-input-element align-items-center">
                <p data-cy="redirect-url" id="redirect-url">{`${window.public_config?.TOOLJET_HOST}${
                  window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : '/'
                }sso/google/${configId}`}</p>
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
