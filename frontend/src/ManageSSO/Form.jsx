import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/_components';

export function Form({ settings, updateData, darkMode }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [showDisablingPasswordConfirmation, setShowDisablingPasswordConfirmation] = useState(false);
  const { t } = useTranslation();

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

  return (
    <div className="sso-card-wrapper">
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
      <div className="card-header">
        <div className="d-flex justify-content-between title-with-toggle">
          <div className="card-title" data-cy="card-title">
            {t('header.organization.menus.manageSSO.passwordLogin', 'Password Login')}
            <span className={`tj-text-xsm ${enabled ? 'enabled-tag' : 'disabled-tag'}`} data-cy="status-label">
              {enabled ? t('globals.enabled', 'Enabled') : t('globals.disabled', 'Disabled')}
            </span>
          </div>
          <div>
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={enabled}
                onChange={() => (enabled ? setShowDisablingPasswordConfirmation(true) : changeStatus())}
                data-cy="password-enable-toggle"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
