import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';

import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { PushAppsModal as UntypedPushAppsModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal';

import type { DataSourceEntry } from '@/_services/types/globalDatasource.types';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

interface PushDataSourceModalProps {
  show: boolean;
  onClose: () => void;
  resourceType: 'datasource';
  resourceName: string;
  onSuccess: () => void;
}

// Untyped EE JS: TS infers every prop as required, but a data source push uses only these (as the old page does).
// Undefined on CE, where `@ee/` resolves to an empty module.
const PushAppsModal = UntypedPushAppsModal as React.ComponentType<PushDataSourceModalProps> | undefined;

interface DataSourceUnsyncedButtonProps {
  dataSource: DataSourceEntry;
}

// Same rule and push flow as the old data sources page (modules/dataSources/components/LIstItem).
export default function DataSourceUnsyncedButton({ dataSource }: DataSourceUnsyncedButtonProps) {
  const queryClient = useQueryClient();
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  const currentBranch = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.currentBranch);
  const isGitSyncConfigured = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isGitSyncConfigured);

  const isOnDefaultBranch = !!(currentBranch?.is_default || currentBranch?.isDefault);
  // Strict `false`: a missing `is_synced` (list API not sending it yet) means unknown, not unsynced.
  const isUnsynced = isGitSyncConfigured && !!currentBranch && isOnDefaultBranch && dataSource.is_synced === false;

  if (!isUnsynced || !PushAppsModal) return null;

  return (
    <>
      <Tooltip arrow content="Click to push datasource to git">
        <button
          type="button"
          className="tw-flex tw-size-5 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 hover:tw-bg-button-danger-secondary-hover"
          aria-label={`Push ${dataSource.name} to git`}
          onClick={() => setIsPushModalOpen(true)}
        >
          <RefreshCcw size={12} className="tw-text-icon-danger" />
        </button>
      </Tooltip>

      <PushAppsModal
        show={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        resourceType="datasource"
        resourceName={dataSource.name}
        onSuccess={() => {
          setIsPushModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['dataSourcesV2'] });
        }}
      />
    </>
  );
}
