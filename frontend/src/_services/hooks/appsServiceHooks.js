import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { getWorkspaceId } from '@/_helpers/utils';
import { useAppsStore } from '@/_stores/appsStore';
import { getActiveBranchId } from '@/_helpers/active-branch';
import { appsService } from '@/_services/apps.service';
import { authenticationService } from '@/_services/authentication.service';

import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { appTypeToDisplayNameMapping } from '../../pages/AppsDashboard/helper';

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
  const { pageNo = 1, folderId = '', appSearchQuery = '', appType = 'front-end', pageSize } = queryParams;
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['apps', { pageNo, folderId, appSearchQuery, appType, pageSize }],
    queryFn: () => appsService.getAll(pageNo, folderId, appSearchQuery, appType, pageSize),
    select: selectApps,
    enabled,
  });
}

// Shared by every consumer of `/v2/apps`, so identical params resolve to one cache entry and one request.
export const appsV2QueryOptions = ({
  appType = 'front-end',
  folderId = '',
  searchQuery = '',
  pageNo = 1,
  pageSize = 50,
}) => {
  const queryParams = { appType, branchId: getActiveBranchId(), pageSize, pageNo, folderId, searchQuery };

  return queryOptions({
    queryKey: ['appsV2', queryParams],
    queryFn: ({ signal }) => appsService.fetchAppsV2(queryParams, { signal }),
    // The previous page stays visible while the next one loads.
    placeholderData: keepPreviousData,
  });
};

// A folder's apps loaded page by page, for the list view's expanded folders.
// The `'infinite'` suffix keeps it apart from a `useQuery` entry with the same params; the prefix keeps `appsV2` invalidation covering it.
export const appsV2InfiniteQueryOptions = ({ appType = 'front-end', folderId, pageSize = 20 }) => {
  const queryParams = { appType, branchId: getActiveBranchId(), pageSize, folderId };

  return infiniteQueryOptions({
    queryKey: ['appsV2', queryParams, 'infinite'],
    queryFn: ({ pageParam, signal }) => appsService.fetchAppsV2({ ...queryParams, pageNo: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.page_size < lastPage.total ? lastPage.page + 1 : undefined,
  });
};

export function useFetchAppsV2(params) {
  return useQuery(appsV2QueryOptions(params));
}

export function useFetchAppsLimit(options) {
  return useQuery({
    queryKey: ['appsLimit'],
    queryFn: appsService.getAppsLimit,
    enabled: options?.enabled ?? true,
  });
}

const workflowLimitSelect = (raw) => raw?.appsCount;

export function useFetchWorkflowLimit(limitType, options) {
  return useQuery({
    queryKey: ['workflowLimit', limitType],
    queryFn: () => appsService.getWorkflowLimit(limitType),
    select: workflowLimitSelect,
    enabled: options?.enabled ?? true,
  });
}

export function useCloneApp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ body, appType }) => appsService.cloneResource(body, appType),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} cloned successfully!`);

      setCurrentPage(1);

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });

      navigate(`/${getWorkspaceId()}/apps/${response?.imports?.app[0]?.id}`, {
        state: { commitEnabled: variables?.isCommitEnabled ?? false },
      });
    },
  });
}

export function useRenameApp() {
  const queryClient = useQueryClient();

  const currentPage = useAppsStore((state) => state.currentPage);

  return useMutation({
    mutationFn: ({ appId, name, appType }) => appsService.renameApp(appId, name, appType),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} name has been updated!`);

      queryClient.invalidateQueries({ queryKey: ['appsV2', { pageNo: currentPage, appType: variables.appType }] });
    },
  });
}

export function useCreateApp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ body }) => appsService.createApp(body),
    onError: (error) => {
      handleError(error);
    },
    onSuccess: (response, variables) => {
      setCurrentPage(1);

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables?.body?.type }] });

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

// Resolves with `{ blocked_ids }`; the caller shows the blocked list. Lists refresh only when something was deleted.
export function useBulkDeleteApps() {
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ appIds: string[], appType: 'front-end' | 'module' | 'workflow' }} variables */
    mutationFn: ({ appIds, appType }) => appsService.bulkDeleteApps({ appIds, appType }),
    onError: handleError,
    onSuccess: (response, variables) => {
      if (response?.blocked_ids?.length) return;

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });
      if (variables.appType === 'workflow') {
        queryClient.invalidateQueries({ queryKey: ['workflowLimit', 'instance'] });
        queryClient.invalidateQueries({ queryKey: ['workflowLimit', 'workspace'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['appsLimit'] });
      }
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ appId, appType }) => appsService.deleteApp(appId, appType),
    onError: () => {
      toast.error('Could not delete the app.');
    },
    onSuccess: (response, variables) => {
      setCurrentPage(1);

      toast.success(`${appTypeToDisplayNameMapping[variables.appType]} deleted successfully.`);

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });

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

  const currentPage = useAppsStore((state) => state.currentPage);

  return useMutation({
    mutationFn: ({ icon, appId }) => appsService.changeIcon(icon, appId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Icon updated.');

      queryClient.invalidateQueries({ queryKey: ['appsV2', { pageNo: currentPage, appType: variables.appType }] });
    },
  });
}

export function useImportResource() {
  return useMutation({
    mutationFn: ({ body, appType }) => appsService.importResource(body, appType),
  });
}

export function useFetchAppVersions(appId, options) {
  return useQuery({
    queryKey: ['appVersions', appId],
    queryFn: () => appsService.getVersions(appId),
    enabled: options?.enabled ?? true,
  });
}

const selectAppTables = (raw) => raw?.tables;

export function useFetchAppTables(appId) {
  return useQuery({
    queryKey: ['appTables', appId],
    queryFn: () => appsService.getTables(appId),
    enabled: !!appId,
    select: selectAppTables,
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

// Pin calls answer 204 with no body, so the list is refetched to show the new pin state and order.
export function usePinResources() {
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ resourceType: 'app' | 'folder', resourceIds: string[], appType: TAppType }} variables */
    mutationFn: ({ resourceType, resourceIds }) => appsService.pinResources({ resourceType, resourceIds }),
    onError: handleError,
    onSuccess: (data, variables) => {
      const count = variables.resourceIds.length;
      // Apps are named after the dashboard they're on: app, module or workflow.
      const noun = variables.resourceType === 'folder' ? 'folder' : appTypeToDisplayNameMapping[variables.appType];
      toast.success(`${count} ${count === 1 ? noun : `${noun}s`} pinned`);

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });
    },
  });
}

export function useUnpinResource() {
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ resourceType: 'app' | 'folder', resourceId: string, appType: TAppType }} variables */
    mutationFn: ({ resourceType, resourceId }) => appsService.unpinResource({ resourceType, resourceId }),
    onError: handleError,
    onSuccess: (response, variables) =>
      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] }),
  });
}

// Reorder answers 204, so the root page is reordered in the cache at once, restored on error, and refetched after.
export function useReorderPins() {
  const queryClient = useQueryClient();

  return useMutation({
    /** @param {{ appType: TAppType, rootQueryKey: unknown[], items: ListItem[] }} variables `items`: the root page's rows in their new order */
    mutationFn: ({ appType, items }) =>
      appsService.reorderPins({
        appType,
        pins: items.filter((item) => item.pinned).map((item) => ({ resource_type: item.kind, resource_id: item.id })),
      }),
    onMutate: async ({ rootQueryKey, items }) => {
      await queryClient.cancelQueries({ queryKey: rootQueryKey, exact: true });
      const previous = queryClient.getQueryData(rootQueryKey);
      queryClient.setQueryData(rootQueryKey, (data) => data && { ...data, items });
      return { previous };
    },
    onError: (error, { rootQueryKey }, context) => {
      queryClient.setQueryData(rootQueryKey, context?.previous);
      handleError(error);
    },
    onSettled: (data, error, { appType }) => queryClient.invalidateQueries({ queryKey: ['appsV2', { appType }] }),
  });
}
