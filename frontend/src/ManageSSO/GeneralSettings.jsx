import React, { useState } from 'react';
import { organizationService, authenticationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function GeneralSettings({ settings, updateData }) {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const [enableSignUp, setEnableSignUp] = useState(settings?.enable_sign_up || false);
  const [domain, setDomain] = useState(settings?.domain || '');
  const [isSaving, setSaving] = useState(false);

  const reset = () => {
    setEnableSignUp(settings?.enable_sign_up || false);
    setDomain(settings?.domain || '');
  };

  const saveSettings = () => {
    setSaving(true);
    organizationService.editOrganization({ enableSignUp, domain }).then(
      () => {
        setSaving(false);
        updateData('general', { enable_sign_up: enableSignUp, domain });
        toast.success('updated sso configurations', {
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
        <div className="card-title" data-cy="card-title">
          General Settings
        </div>
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
                data-cy="form-check-input"
              />
              <span className="form-check-label" data-cy="form-check-label">
                Enable signup
              </span>
            </label>
            <div className="help-text">
              <div data-cy="general-settings-help-text">
                New account will be created for user&apos;s first time SSO sign in
              </div>
            </div>
          </div>
          <div className="form-group mb-3">
            <label className="form-label" data-cy="allowed-domains-label">
              Allowed domains
            </label>
            <div>
              <input
                type="text"
                className="form-control"
                placeholder="Enter Domains"
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                data-cy="allowed-domain-input"
              />
            </div>
          </div>
          {!isSingleOrganization && (
            <div className="form-group mb-3">
              <label className="form-label" data-cy="login-url-label">
                Login URL
              </label>
              <div data-cy="login-url">{`${window.location.protocol}//${window.location.host}/login/${authenticationService?.currentUserValue?.organization_id}`}</div>
              <div className="help-text mt-1">
                <div data-cy="login-help-text">Use this URL to login directly to this workspace</div>
              </div>
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
