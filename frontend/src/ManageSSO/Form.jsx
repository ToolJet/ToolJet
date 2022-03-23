import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function Form({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);
  const [enableSignUp, setEnableSignUp] = useState(settings?.configs?.enable_sign_up || false);
  const [isSaving, setSaving] = useState(false);
  const single_organization = window.public_config?.SINGLE_ORGANIZATION === 'true';

  const reset = () => {
    setEnableSignUp(settings?.configs?.enable_sign_up || false);
  };
  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganizationConfigs({ type: 'form', configs: { enableSignUp } }).then(
      (data) => {
        updateData('form', { id: data.id, configs: { enable_sign_up: enableSignUp } });
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
    organizationService.editOrganizationConfigs({ type: 'form', enabled: !enabled }).then(
      (data) => {
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        updateData('form', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} Form login`, {
          position: 'top-center',
        });
      },
      () => {
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
            Form
            <span className={`badge bg-${enabled ? 'green' : 'grey'} ms-1`}>{enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <label className="form-check form-switch">
              <input className="form-check-input" type="checkbox" checked={enabled} onChange={changeStatus} />
            </label>
          </div>
        </div>
      </div>
      {single_organization && (
        <div className="card-body">
          <form noValidate>
            <div className="form-group mb-3">
              <label className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  onChange={() => setEnableSignUp((enableSignUp) => !enableSignUp)}
                  checked={enableSignUp}
                />
                <span className="form-check-label">Enable signup</span>
              </label>
            </div>
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
      )}
    </div>
  );
}
