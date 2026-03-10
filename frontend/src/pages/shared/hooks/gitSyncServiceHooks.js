import { useQuery } from '@tanstack/react-query';

import { gitSyncService } from '@/_services/git_sync.service';
import { authenticationService } from '@/_services/authentication.service';

export function useFetchOrgGitStatus() {
  const workspaceId = authenticationService.currentSessionValue.current_organization_id;

  return useQuery({
    queryKey: ['orgGitStatus', workspaceId],
    queryFn: () => gitSyncService.getGitStatus(workspaceId),
    enabled: !!workspaceId,
  });
}
