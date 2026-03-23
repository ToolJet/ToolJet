import { isEmpty } from 'lodash';
import { useMutation, useQuery } from '@tanstack/react-query';

import { gitSyncService } from '@/_services/git_sync.service';
import { authenticationService } from '@/_services/authentication.service';

export function useFetchOrgGitStatus() {
  const workspaceId = authenticationService.currentSessionValue?.current_organization_id;

  return useQuery({
    queryKey: ['orgGitStatus', workspaceId],
    queryFn: () => gitSyncService.getGitStatus(workspaceId),
    enabled: !!workspaceId,
  });
}

const formatRepoApps = (raw) => ({
  reposObj: raw?.meta_data,
  reposOptionList: !isEmpty(raw?.meta_data)
    ? Object.keys(raw.meta_data).map((gitAppId) => ({ label: raw.meta_data[gitAppId].git_app_name, value: gitAppId }))
    : [],
});

export function useFetchRepoApps() {
  return useQuery({
    queryKey: ['repoApps'],
    queryFn: () => gitSyncService.gitPull(),
    select: formatRepoApps,
  });
}

export function useImportGitApp() {
  return useMutation({
    mutationFn: (body) => gitSyncService.importGitApp(body),
  });
}
