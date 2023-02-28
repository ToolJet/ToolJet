import React, { useState, useEffect } from 'react';
import { authenticationService } from '@/_services';
import { CustomSelect } from './CustomSelect';
import { getWorkspaceIdFromURL, appendWorkspaceId, getAvatar } from '../../_helpers/utils';

export const OrganizationList = function () {
  const { current_organization_id } = authenticationService.currentOrgValue;
  const [organizationList, setOrganizationList] = useState([]);
  const [getOrgStatus, setGetOrgStatus] = useState('');

  useEffect(() => {
    setGetOrgStatus('loading');
    const orgDetailsObservable = authenticationService.currentOrganization.subscribe((newOrgDetails) => {
      setOrganizationList(newOrgDetails.organizations ?? []);
      if (newOrgDetails.organizations?.length > 0) setGetOrgStatus('success');
    });

    () => orgDetailsObservable.unsubscribe();
  }, []);

  const switchOrganization = (orgId) => {
    if (getWorkspaceIdFromURL() !== orgId) {
      const newPath = appendWorkspaceId(orgId, location.pathname, true);
      window.history.replaceState(null, null, newPath);
      window.location.reload();
    }
  };

  const options = organizationList.map((org) => ({
    value: org.id,
    name: org.name,
    label: (
      <div className="row align-items-center">
        <div className="col organization-avatar">
          <span className="avatar avatar-sm bg-secondary-lt" data-cy={`${org.name}-avatar`}>
            {getAvatar(org.name)}
          </span>
        </div>
        <div className="col">
          <div className="org-name">{org.name}</div>
        </div>
      </div>
    ),
  }));

  return (
    <CustomSelect
      isLoading={getOrgStatus === 'loading'}
      options={options}
      value={current_organization_id}
      onChange={(id) => switchOrganization(id)}
    />
  );
};
