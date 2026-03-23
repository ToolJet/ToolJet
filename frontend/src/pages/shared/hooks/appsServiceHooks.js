import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getWorkspaceId } from '@/_helpers/utils';
import { appsService } from '@/_services/apps.service';
import { authenticationService } from '@/_services/authentication.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

import { useAppsStore } from '../store';
import { useAppFilters } from './useAppFilters';
import { appTypeToDisplayNameMapping } from '../helper';

export const handleError = (error) => {
  if ([409, 451].includes(error.statusCode)) return;

  const errorMessage = error?.error || error?.message || 'Some Error Occured';
  toast.error(errorMessage, { position: 'top-center', style: { fontSize: '12px' } });
};

const selectApps = (raw) => ({
  apps: raw?.apps ?? [],
  meta: raw?.meta ?? {},
});

export function useFetchApps(queryParams, options) {
  const { pageNo = 1, folderId = '', appSearchQuery = '', appType = 'front-end' } = queryParams;
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['apps', { pageNo, folderId, appSearchQuery, appType }],
    queryFn: () => appsService.getAll(pageNo, folderId, appSearchQuery, appType),
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
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ body, appType }) => appsService.cloneResource(body, appType),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} cloned successfully!`);

      navigate(`/${getWorkspaceId()}/apps/${response?.imports?.app[0]?.id}`, {
        // TODO: Pass actual commit Enabled value later on, for timebeing have passed as false
        state: { commitEnabled: false },
      });
    },
  });
}

export function useRenameApp() {
  const queryClient = useQueryClient();

  const { folderId } = useAppFilters();
  const currentPage = useAppsStore((state) => state.currentPage);
  const appSearchQuery = useAppsStore((state) => state.appSearchQuery);

  return useMutation({
    mutationFn: ({ appId, name, appType }) => appsService.saveApp(appId, { name }, appType),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} name has been updated!`);

      queryClient.invalidateQueries({
        queryKey: ['apps', { pageNo: currentPage, folderId, appSearchQuery, appType: variables.appType }],
      });
    },
  });
}

export function useCreateApp() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ body }) => appsService.createApp(body),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      posthogHelper.captureEvent('click_new_app', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        app_id: response?.id,
        button_name: 'click_new_app_button',
      });

      variables?.body?.type === 'front-end' &&
        posthogHelper.captureEvent('app_created', {
          entry_source: variables.body.prompt ? 'prompt' : 'create_button',
          prompt: variables.body.prompt,
        });

      navigate(`/${getWorkspaceId()}/apps/${response.id}`, {
        state: { commitEnabled: variables?.isCommitEnabled ?? false, prompt: variables?.body?.prompt },
      });

      variables?.body?.type !== 'front-end' &&
        toast.success(`${appTypeToDisplayNameMapping[variables.body.type]} created successfully!`);
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  const { folderId } = useAppFilters();
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const appSearchQuery = useAppsStore((state) => state.appSearchQuery);

  return useMutation({
    mutationFn: ({ appId, appType }) => appsService.deleteApp(appId, appType),
    onError: () => {
      toast.error('Could not delete the app.');
    },
    onSuccess: (response, variables) => {
      console.log('delete app variables', variables);

      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} deleted successfully.`);

      // queryClient.invalidateQueries({ queryKey: ['folders'] });
      setCurrentPage(1);
      queryClient.invalidateQueries({
        queryKey: ['apps', { folderId, appSearchQuery, appType: variables.appType }],
      });

      // TODO: re-fetch apps list
      // this.fetchApps(
      //   this.state.currentPage
      //     ? this.state.apps?.length === 1
      //       ? this.state.currentPage - 1
      //       : this.state.currentPage
      //     : 1,
      //   this.state.currentFolder.id
      // );

      if (variables.appType === 'workflow') {
        queryClient.invalidateQueries({ queryKey: ['workflowLimit', 'instance'] });
        queryClient.invalidateQueries({ queryKey: ['workflowLimit', 'workspace'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['appsLimit'] });
      }
    },
  });
}

export function useChangeAppIcon() {
  const queryClient = useQueryClient();

  const { folderId } = useAppFilters();
  const currentPage = useAppsStore((state) => state.currentPage);
  const appSearchQuery = useAppsStore((state) => state.appSearchQuery);

  return useMutation({
    mutationFn: ({ icon, appId }) => appsService.changeIcon(icon, appId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Icon updated.');

      queryClient.invalidateQueries({
        queryKey: ['apps', { pageNo: currentPage, folderId, appSearchQuery, appType: variables.appType }],
      });
    },
  });
}

export function useImportResource() {
  return useMutation({
    mutationFn: ({ body, appType }) => appsService.importResource(body, appType),
  });
}

export function useFetchAppVersions(appId) {
  return useQuery({
    queryKey: ['appVersions', appId],
    queryFn: () => appsService.getVersions(appId),
    enabled: !!appId,
  });
}

export function useFetchAppTables(appId) {
  return useQuery({
    queryKey: ['appTables', appId],
    queryFn: () => appsService.getTables(appId),
    enabled: !!appId,
  });
}

const selectTablesFromVersion = (raw) => {
  const { dataQueries = [] } = raw?.editing_version || {};
  const extractedIdData = [];

  dataQueries.forEach((item) => {
    if (item.kind === 'tooljetdb' && item.options?.operation === 'join_tables') {
      const joinOptions = item.options?.join_table?.joins ?? [];

      joinOptions.forEach((join) => {
        const { table, conditions } = join;

        if (table) extractedIdData.push(table);

        conditions?.conditionsList?.forEach((condition) => {
          const { leftField, rightField } = condition;

          if (leftField?.table) extractedIdData.push(leftField.table);
          if (rightField?.table) extractedIdData.push(rightField.table);
        });
      });
    }

    if (item.kind === 'tooljetdb' && item.options?.tableId) extractedIdData.push(item.options.tableId);
  });

  return Array.from(new Set(extractedIdData)).map((id) => ({ table_id: id }));
};

export function useFetchAppByVersion(appId, versionId) {
  return useQuery({
    queryKey: ['appByVersion', appId, versionId],
    queryFn: () => appsService.getAppByVersion(appId, versionId),
    select: selectTablesFromVersion,
    enabled: !!appId && !!versionId,
  });
}

export const downloadExportedData = (data, fileName) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function useExportApp() {
  return useMutation({
    mutationFn: ({ requestBody, appType }) => appsService.exportResource(requestBody, appType),
  });
}
