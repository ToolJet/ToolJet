import { useQuery } from '@tanstack/react-query';

import { organizationService } from '@/_services/organization.service';

const fetchOrganizationSelector = (raw) => raw?.organizations ?? [];

export function useFetchOrganizations(queryParams) {
  const { status = 'active', currentPage, perPageCount, name } = queryParams ?? {};

  return useQuery({
    queryKey: ['organizations', { status, currentPage, perPageCount, name }],
    queryFn: () => organizationService.getOrganizations(status, currentPage, perPageCount, name),
    select: fetchOrganizationSelector,
  });
}

const fetchWorkspacesLimitSelector = (raw) => raw?.workspacesCount ?? null;

export function useFetchWorkspacesLimit() {
  return useQuery({
    queryKey: ['workspacesLimit'],
    queryFn: organizationService.getWorkspacesLimit,
    select: fetchWorkspacesLimitSelector,
  });
}
