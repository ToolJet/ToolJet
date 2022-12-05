import React, { useState, useEffect } from 'react';
import { authenticationService, organizationService } from '@/_services';
import Select from '@/_ui/Select';

export const OrganizationList = function () {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const { organization_id } = authenticationService.currentUserValue;
  const [organizationList, setOrganizationList] = useState([]);
  const [getOrgStatus, setGetOrgStatus] = useState('');

  useEffect(() => {
    !isSingleOrganization && getOrganizations();
  }, [isSingleOrganization]);

  const getOrganizations = () => {
    setGetOrgStatus('loading');
    organizationService.getOrganizations().then(
      (data) => {
        setOrganizationList(data.organizations);
        setGetOrgStatus('success');
      },
      () => {
        setGetOrgStatus('failure');
      }
    );
  };

  const switchOrganization = (orgId) => {
    organizationService.switchOrganization(orgId).then(
      (data) => {
        authenticationService.updateCurrentUserDetails(data);
        window.location.href = '';
      },
      () => {
        return (window.location.href = `login/${orgId}`);
      }
    );
  };

  const options = organizationList.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  return (
    <Select
      width={300}
      isLoading={getOrgStatus === 'loading'}
      options={options}
      value={organization_id}
      onChange={(id) => switchOrganization(id)}
    />
  );
};
