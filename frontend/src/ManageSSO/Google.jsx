import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function Google({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
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
        toast.error('Error saving sso configurations', {
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
        toast.error('Error saving sso configurations', {
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
            Google
            <span className={`badge bg-${enabled ? 'green' : 'grey'} ms-1`} data-cy="status-label">
              {enabled ? 'Enabled' : 'Disabled'}
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
            <label className="form-label" data-cy="client-id-label">
              Client Id
            </label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Client Id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                data-cy="client-id-input"
              />
            </div>
          </div>
          {configId && (
            <div className="form-group mb-3">
              <label className="form-label" data-cy="redirect-url-label">
                Redirect URL
              </label>
              <div data-cy="redirect-url">{`${window.location.protocol}//${window.location.host}/sso/google/${configId}`}</div>
            </div>
          )}
          <div className="form-footer">
            <button type="button" className="btn btn-light mr-2" onClick={reset} data-cy="cancel-button">
              Cancel
            </button>
            <button
              type="button"
              className={`btn mx-2 btn-primary ${isSaving ? 'btn-loading' : ''}`}
              disabled={isSaving}
              onClick={saveSettings}
              data-cy="save-button"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
