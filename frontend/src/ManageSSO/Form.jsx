import React, { useState } from 'react';
import { organizationService } from '@/_services';
import { toast } from 'react-hot-toast';

export function Form({ settings, updateData }) {
  const [enabled, setEnabled] = useState(settings?.enabled || false);

  const changeStatus = () => {
    organizationService.editOrganizationConfigs({ type: 'form', enabled: !enabled }).then(
      (data) => {
        const enabled_tmp = !enabled;
        setEnabled(enabled_tmp);
        updateData('form', { id: data.id, enabled: enabled_tmp });
        toast.success(`${enabled_tmp ? 'Enabled' : 'Disabled'} Password login`, { position: 'top-center' });
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
          <div className="card-title" data-cy="card-title">
            Password Login
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
    </div>
  );
}
