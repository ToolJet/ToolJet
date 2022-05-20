import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function OpenId({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [clientId, setClientId] = useState(settings?.configs?.clientId || '');
  const [clientSecret, setClientSecret] = useState(settings?.configs?.clientSecret || '');
  const [name, setName] = useState(settings?.configs?.name || '');
  const [wellKnownUrl, setWellKnownUrl] = useState(settings?.configs?.wellKnownUrl || '');
  const [isSaving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(settings?.id);

  const reset = () => {
    setClientId(settings?.configs?.clientId || '');
    setClientSecret(settings?.configs?.clientSecret || '');
    setName(settings?.configs?.name || '');
    setWellKnownUrl(settings?.configs?.wellKnownUrl || '');
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService
      .editOrganizationConfigs({ type: 'openId', configs: { name, clientId, clientSecret, wellKnownUrl } })
      .then(
        (data) => {
          setSaving(false);
          data.id && setConfigId(data.id);
          updateData('openId', {
            id: data.id,
            configs: { clientId: clientId },
          });
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
    organizationService.editOrganizationConfigs({ type: 'openId', enabled: !enabled }).then(
      (data) => {
        setSaving(false);
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        data.id && setConfigId(data.id);
        updateData('openId', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} OpenId SSO`, {
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
          <div className="card-title">
            openId
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
            <label className="form-label">Name</label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Name "
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label"> Client Secret</label>
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
            <label className="form-label">Well known URL</label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Well known URL"
                value={wellKnownUrl}
                onChange={(e) => setWellKnownUrl(e.target.value)}
              />
            </div>
          </div>
          {configId && (
            <div className="form-group mb-3">
              <label className="form-label">Redirect URL</label>
              <div>{`${window.location.protocol}//${window.location.host}/sso/open-id/${configId}`}</div>
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
