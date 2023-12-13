import React, { useState, useEffect } from 'react';
import { authenticationService, organizationService } from '@/_services';
import { CustomSelect } from './CustomSelect';
import { getAvatar } from '@/_helpers/utils';
import { appendWorkspaceId, getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import { ToolTip } from '@/_components';

export const OrganizationList = function () {
  const { current_organization_id } = authenticationService.currentSessionValue;
  const [organizationList, setOrganizationList] = useState([]);
  const [getOrgStatus, setGetOrgStatus] = useState('');
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [workspacesLimit, setWorkspacesLimit] = useState({});

  useEffect(() => {
    setGetOrgStatus('loading');
    organizationService.getWorkspacesLimit().then((data) => {
      setWorkspacesLimit(data?.workspacesCount);
    });
    const sessionObservable = authenticationService.currentSession.subscribe((newSession) => {
      setOrganizationList(newSession.organizations ?? []);
      if (newSession.organizations?.length > 0) setGetOrgStatus('success');
    });

    () => sessionObservable.unsubscribe();
  }, []);

  const switchOrganization = (id) => {
    const organization = organizationList.find((org) => org.id === id);
    if (![id, organization.slug].includes(getWorkspaceIdOrSlugFromURL())) {
      const newPath = appendWorkspaceId(organization.slug || id, location.pathname, true);
      window.history.replaceState(null, null, newPath);
      window.location.reload();
    }
  };

  const options = organizationList.map((org) => ({
    value: org.id,
    name: org.name,
    slug: org.slug,
    label: (
      <div className={`align-items-center d-flex tj-org-dropdown  ${darkMode && 'dark-theme'}`}>
        <div
          className="dashboard-org-avatar "
          data-cy={`${String(org.name).toLowerCase().replace(/\s+/g, '-')}-avatar`}
        >
          {getAvatar(org.name)}
        </div>
        <ToolTip message={org.name} placement="right">
          <div className="org-name" data-cy={`${String(org.name).toLowerCase().replace(/\s+/g, '-')}-name-selector`}>
            {org.name}
          </div>
        </ToolTip>
        {org?.license_type !== 'basic' && !org?.is_license_expired && (
          <div className="issued-license">{org?.license_type}</div>
        )}
      </div>
    ),
  }));

  return (
    <div className="org-select-container">
      <CustomSelect
        workspacesLimit={workspacesLimit}
        isLoading={getOrgStatus === 'loading'}
        options={options}
        value={current_organization_id}
        onChange={(id) => switchOrganization(id)}
        className={`tj-org-select  ${darkMode && 'dark-theme'}`}
      />
    </div>
  );
};
