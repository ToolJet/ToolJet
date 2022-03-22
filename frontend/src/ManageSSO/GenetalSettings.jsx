import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function GeneralSettings({ settings, updateData }) {
  const [enableSignUp, setEnableSignUp] = useState(settings?.enable_sign_up || false);
  const [domain, setDomain] = useState(settings?.domain || '');
  const [autoAssign, setAutoAssign] = useState(settings?.auto_assign || false);
  const [isSaving, setSaving] = useState(false);

  const reset = () => {
    setEnableSignUp(settings?.enable_sign_up || false);
    setAutoAssign(settings?.auto_assign || false);
    setDomain(settings?.domain || '');
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganization({ enableSignUp, autoAssign, domain }).then(
      () => {
        updateData('general', { enable_sign_up: enableSignUp, auto_assign: autoAssign, domain });
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

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">General Settings</div>
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
              />
              <span className="form-check-label">Enable signup</span>
            </label>
            <div className="help-text">
              <div>New account will be created for user&apos;s first time sso sign in</div>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label">Allowed domain</label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Domains"
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={autoAssign}
                onChange={() => setAutoAssign((autoAssign) => !autoAssign)}
              />
              <span className="form-check-label">Auto assign</span>
            </label>
            <div className="help-text">
              <div>Auto assign new users with configured domain to this organization</div>
            </div>
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
    </div>
  );
}
