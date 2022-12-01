import React, { useState, useEffect } from 'react';
import { authenticationService, organizationService } from '@/_services';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';

export const OrganizationList = function () {
  const isSingleOrganization = window.public_config?.DISABLE_MULTI_WORKSPACE === 'true';
  const { admin, organization_id } = authenticationService.currentUserValue;
  const [organization, setOrganization] = useState(authenticationService.currentUserValue?.organization);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [organizationList, setOrganizationList] = useState([]);
  const [getOrgStatus, setGetOrgStatus] = useState('loading');
  const [isListOrganizations, setIsListOrganizations] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const { t } = useTranslation();

  const getAvatar = (organization) => {
    if (!organization) return;

    const orgName = organization.split(' ').filter((e) => e && !!e.trim());
    if (orgName.length > 1) {
      return `${orgName[0]?.[0]}${orgName[1]?.[0]}`;
    } else if (organization.length >= 2) {
      return `${organization[0]}${organization[1]}`;
    } else {
      return `${organization[0]}${organization[0]}`;
    }
  };

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

  return <Select options={organizationList} value={organization_id} onChange={({ id }) => switchOrganization(id)} />;
};
