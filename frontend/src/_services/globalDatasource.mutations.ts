import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { handleHttpErrorMessages } from '@/_helpers/utils';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';
import { dataSourceFolderService } from '@/_services/dataSourceFolder.service';
import { globalDatasourceService } from '@/_services/globalDatasource.service';

import type {
  DataSourceBulkResponse,
  DataSourceFolderDeleteMode,
  DataSourceListItem,
  DataSourceListResponse,
  DataSourcePinKind,
} from './types/globalDatasource.types';

// What `handleResponse` rejects with.
export interface ServiceRejection {
  statusCode: number;
  error: string;
}

// Every dashboard mutation should invalidate this prefix (see globalDatasource.queries.ts) so the list refetches.
const DATA_SOURCES_QUERY_KEY = ['dataSourcesV2'];

export function useCreateDataSourceFolder() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ServiceRejection, { name: string }>({
    mutationFn: ({ name }) => dataSourceFolderService.createFolder(name),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: () => {
      toast.success('Folder created successfully!');
      queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY });
    },
  });
}

export function useRenameDataSourceFolder() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ServiceRejection, { name: string; folderId: string }>({
    mutationFn: ({ name, folderId }) => dataSourceFolderService.renameFolder(name, folderId),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: () => {
      toast.success('Folder renamed successfully!');
      queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY });
    },
  });
}

// No `onError`: a refusal carries the branches that still hold data sources, which the dialog turns into a warning.
export function useDeleteDataSourceFolder() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ServiceRejection, { folderId: string }>({
    mutationFn: ({ folderId }) => dataSourceFolderService.deleteFolder(folderId),
    onSuccess: () => {
      toast.success('Folder deleted successfully!');
      queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY });
    },
  });
}

const showPinError = (error: ServiceRejection) => {
  toast.error(error?.error || 'Something went wrong. Please try again.');
};

export function usePinDataSourceResources() {
  const queryClient = useQueryClient();
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);

  return useMutation<unknown, ServiceRejection, { resourceType: DataSourcePinKind; resourceIds: string[] }>({
    mutationFn: ({ resourceType, resourceIds }) =>
      globalDatasourceService.pinResources({ resourceType, resourceIds, branchId }),
    onError: showPinError,
    onSuccess: (_, { resourceType, resourceIds }) => {
      const count = resourceIds.length;
      const noun = resourceType === 'folder' ? 'folder' : 'datasource';
      toast.success(`${count} ${count === 1 ? noun : `${noun}s`} pinned`);
      queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY });
    },
  });
}

export function useUnpinDataSourceResource() {
  const queryClient = useQueryClient();
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);

  return useMutation<unknown, ServiceRejection, { resourceType: DataSourcePinKind; resourceId: string }>({
    mutationFn: ({ resourceType, resourceId }) =>
      globalDatasourceService.unpinResource({ resourceType, resourceId, branchId }),
    onError: showPinError,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY }),
  });
}

interface ReorderPinsVariables {
  /** Key of the root page the drag happened on; its cache is reordered at once. */
  rootQueryKey: readonly unknown[];
  /** The root page's rows in their new order. */
  items: DataSourceListItem[];
}

// Reorder answers 204, so the root page is reordered in the cache at once, restored on error, and refetched after.
export function useReorderDataSourcePins() {
  const queryClient = useQueryClient();
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);

  return useMutation<unknown, ServiceRejection, ReorderPinsVariables, { previous?: DataSourceListResponse }>({
    mutationFn: ({ items }) =>
      globalDatasourceService.reorderPins({
        pins: items.filter((item) => item.pinned).map((item) => ({ resource_type: item.kind, resource_id: item.id })),
        branchId,
      }),
    onMutate: async ({ rootQueryKey, items }) => {
      await queryClient.cancelQueries({ queryKey: rootQueryKey, exact: true });
      const previous = queryClient.getQueryData<DataSourceListResponse>(rootQueryKey);
      queryClient.setQueryData<DataSourceListResponse>(rootQueryKey, (data) => data && { ...data, items });
      return { previous };
    },
    onError: (error, { rootQueryKey }, context) => {
      queryClient.setQueryData(rootQueryKey, context?.previous);
      showPinError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY }),
  });
}

// The caller shows the blocked items. A blocked response wrote nothing, so the list refetches only after one that went through.
function useBulkDataSourceMutation<TVariables>(
  send: (variables: TVariables, branchId: string | null) => Promise<DataSourceBulkResponse>,
  errorMessage: string
) {
  const queryClient = useQueryClient();
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);

  return useMutation<DataSourceBulkResponse, ServiceRejection, TVariables>({
    mutationFn: (variables) => send(variables, branchId),
    onError: (error) => {
      toast.error(error?.error || errorMessage);
    },
    onSuccess: (response) => {
      if (response?.blocked_ids?.length) return;
      queryClient.invalidateQueries({ queryKey: DATA_SOURCES_QUERY_KEY });
    },
  });
}

export const useBulkDeleteDataSources = () =>
  useBulkDataSourceMutation<{ dataSourceIds: string[] }>(
    ({ dataSourceIds }, branchId) => globalDatasourceService.bulkDeleteDataSources({ dataSourceIds, branchId }),
    'Could not delete the datasources.'
  );

export const useBulkMoveDataSources = () =>
  useBulkDataSourceMutation<{ dataSourceIds: string[]; folderId: string }>(
    ({ dataSourceIds, folderId }, branchId) =>
      globalDatasourceService.bulkMoveDataSources({ dataSourceIds, folderId, branchId }),
    'Could not move the datasources.'
  );

export const useBulkRemoveDataSources = () =>
  useBulkDataSourceMutation<{ dataSourceIds: string[] }>(
    ({ dataSourceIds }, branchId) => globalDatasourceService.bulkRemoveDataSources({ dataSourceIds, branchId }),
    'Could not remove the datasources from their folders.'
  );

export const useBulkDeleteDataSourceFolders = () =>
  useBulkDataSourceMutation<{ folderIds: string[]; mode: DataSourceFolderDeleteMode }>(
    ({ folderIds, mode }, branchId) =>
      globalDatasourceService.bulkDeleteDataSourceFolders({ folderIds, mode, branchId }),
    'Could not delete the folders.'
  );
