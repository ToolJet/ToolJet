import { isEmpty } from 'lodash';
// eslint-disable-next-line import/no-unresolved
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
    ? Object.keys(raw.meta_data)
        .filter((key) => key !== 'has_latest_changes' && key !== 'tags' && raw.meta_data[key]?.git_app_name) // Filter out non-app keys like 'has_latest_changes' and 'tags'
        .map((gitAppId) => ({ label: raw.meta_data[gitAppId].git_app_name, value: gitAppId }))
    : [],
});

export function useFetchRepoApps(data) {
  const { selectedBranch, currentBranch } = data;

  return useQuery({
    queryKey: ['repoApps', { selectedBranch, currentBranch }],
    queryFn: () => gitSyncService.gitPull(selectedBranch, currentBranch),
    select: formatRepoApps,
    enabled: !!selectedBranch,
  });
}

const formatGitAppUpdatesByName = (raw) => {
  const latestCommitData = raw?.metaData ?? null;
  const tags = raw?.metaData?.tags ?? null;

  return {
    latestCommitData,
    tags,
    versionOptions: [
      ...(latestCommitData?.latestCommit?.[0]
        ? [
            {
              label: 'Latest commit',
              value: 'latest',
              isLatest: true,
              isDraft: true,
              sha: latestCommitData.latestCommit[0].commitId,
            },
          ]
        : []),
      ...(Array.isArray(tags)
        ? tags.map((tag) => {
            const [, version] = tag.name.split('/');

            return {
              label: version,
              value: tag.name,
              isLatest: false,
              isDraft: false,
            };
          })
        : []),
    ],
  };
};

export function useFetchGitAppUpdatesByName(data) {
  const { appName, branchName = '' } = data;

  return useQuery({
    queryKey: ['gitAppUpdates', { appName, branchName }],
    queryFn: () => gitSyncService.checkForUpdatesByAppName(appName, branchName),
    enabled: !!appName,
    select: formatGitAppUpdatesByName,
  });
}

export function useImportGitApp() {
  return useMutation({
    mutationFn: (body) => gitSyncService.importGitApp(body),
  });
}
