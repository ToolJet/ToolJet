import React, { useState, useEffect } from 'react';
import { authenticationService, organizationService } from '@/_services';
import { CustomSelect } from './CustomSelect';
import { getAvatar, decodeEntities } from '@/_helpers/utils';
import { appendWorkspaceId, getWorkspaceIdOrSlugFromURL } from '@/_helpers/routes';
import { ToolTip } from '@/_components';
import { useCurrentSessionStore } from '@/_stores/currentSessionStore';
import { shallow } from 'zustand/shallow';

/* TODO: 
  each workspace related component has organizations list component which can be moved to a single wrapper. 
  otherwise this component will intiate everytime we switch between pages
*/
export const OrganizationList = function () {
  const { current_organization_id } = authenticationService.currentSessionValue;
  const { fetchOrganizations, organizationList, isGettingOrganizations } = useCurrentSessionStore(
    (state) => ({
      organizationList: state.organizations,
      isGettingOrganizations: state.isGettingOrganizations,
      fetchOrganizations: state.actions.fetchOrganizations,
    }),
    shallow
  );
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [workspacesLimit, setWorkspacesLimit] = useState({});

  useEffect(() => {
    organizationService.getWorkspacesLimit().then((data) => {
      setWorkspacesLimit(data?.workspacesCount);
    });
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {decodeEntities(org.name)}
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
        isLoading={isGettingOrganizations}
        options={options}
        value={current_organization_id}
        onChange={(id) => switchOrganization(id)}
        className={`tj-org-select  ${darkMode && 'dark-theme'}`}
      />
    </div>
  );
};
