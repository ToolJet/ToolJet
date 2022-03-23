import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function Git({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [clientId, setClientId] = useState(settings?.configs?.client_id || '');
  const [clientSecret, setClientSecret] = useState(settings?.configs?.client_secret || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);

  const reset = () => {
    setClientId(settings?.configs?.client_id || '');
    setClientSecret(settings?.configs?.client_secret || '');
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'git', configs: { clientId, clientSecret } }).then(
      (data) => {
        data.id && setConfigId(data.id);
        updateData('git', { id: data.id, configs: { client_id: clientId, client_secret: clientSecret } });
        toast.success('updated sso configurations', {
          position: 'top-center',
        });
      },
      () => {
        toast.error('Error saving sso configurations', {
          position: 'top-center',
        });
      }
    );
    setSaving(false);
  };

  const changeStatus = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'git', enabled: !enabled }).then(
      (data) => {
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        data.id && setConfigId(data.id);
        updateData('git', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} Git sso`, {
          position: 'top-center',
        });
      },
      () => {
        toast.error('Error saving sso configurations', {
          position: 'top-center',
        });
      }
    );
    setSaving(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between title-with-toggle">
          <div className="card-title">
            Git
            <span className={`badge bg-${enabled ? 'green' : 'grey'} ms-1`}>{enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <label className="form-check form-switch">
              <input className="form-check-input" type="checkbox" checked={enabled} onChange={changeStatus} />
            </label>
          </div>
        </div>
      </div>
      <div className="card-body">
        <form noValidate>
          <div className="form-group mb-3">
            <label className="form-label">Client Id</label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Client Id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label">Client Secret</label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
          </div>
          {configId && (
            <div className="form-group mb-3">
              <label className="form-label">Redirect URL</label>
              <div>{`${window.location.protocol}//${window.location.host}/sso/git/${configId}`}</div>
            </div>
          )}
          <div className="form-footer">
            <button type="button" className="btn btn-light mr-2" onClick={reset}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn mx-2 btn-primary ${isSaving ? 'btn-loading' : ''}`}
              disabled={isSaving}
              onClick={saveSettings}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
