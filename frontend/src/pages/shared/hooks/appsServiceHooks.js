import { useMutation, useQuery } from '@tanstack/react-query';

import { appsService } from '@/_services/apps.service';

const selectApps = (raw) => ({
  apps: raw?.apps ?? [],
  meta: raw?.meta ?? {},
});

export function useFetchApps(queryParams, options) {
  const { page = 1, folder = '', searchKey = '', appType = 'front-end' } = queryParams;
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['apps', { page, folder, searchKey, appType }],
    queryFn: () => appsService.getAll(page, folder, searchKey, appType),
    select: selectApps,
    enabled,
  });
}

export function useFetchAppsLimit() {
  return useQuery({
    queryKey: ['appsLimit'],
    queryFn: appsService.getAppsLimit,
  });
}

const workflowLimitSelect = (raw) => raw?.appsCount;

export function useFetchWorkflowLimit(type) {
  return useQuery({
    queryKey: ['workflowLimit', type],
    queryFn: () => appsService.getWorkflowLimit(type),
    select: workflowLimitSelect,
  });
}

export function useCloneApp() {
  return useMutation({
    mutationFn: ({ body, appType }) => appsService.cloneResource(body, appType),
  });
}

export function useRenameApp() {
  return useMutation({
    mutationFn: ({ appId, name, appType }) => appsService.saveApp(appId, { name }, appType),
  });
}

export function useCreateApp() {
  return useMutation({
    mutationFn: (body) => appsService.createApp(body),
  });
}

export function useDeleteApp() {
  return useMutation({
    mutationFn: ({ id, appType }) => appsService.deleteApp(id, appType),
  });
}

export function useChangeAppIcon() {
  return useMutation({
    mutationFn: ({ icon, appId }) => appsService.changeIcon(icon, appId),
  });
}
