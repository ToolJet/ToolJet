import React from 'react';

import RawAppIcon from '@/pages/AppsDashboard/components/AppIcon';
import DashboardCard from './DashboardCard';
import EditButton from './EditButton';
import LaunchButton from './LaunchButton';

import type { AppItem } from '../dummyData/types';
import type { TAppType } from '../helper';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

// Untyped JS module — cast at the import site.
const AppIcon = RawAppIcon as React.ComponentType<{ icon?: string; color?: string; size?: number }>;

interface AppCardProps {
  appDetails: AppItem;
  appType: TAppType;
  onMoreClick?: () => void;
}

export default function AppCard({ appDetails, appType }: AppCardProps) {
  const { icon, pinned, git } = appDetails;

  const { isGitSyncConfigured, currentBranch } = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => ({
    isGitSyncConfigured: state.isGitSyncConfigured,
    currentBranch: state.currentBranch,
  }));

  const isOnDefaultBranch = !!(currentBranch?.is_default || currentBranch?.isDefault);
  const isAppUnsynced = isGitSyncConfigured && currentBranch && isOnDefaultBranch && git?.synced === false;

  return (
    <DashboardCard
      itemDetails={appDetails}
      appType={appType}
      icon={<AppIcon icon={icon} color="blue" size={20} />}
      pinned={pinned}
      startAction={<LaunchButton appDetails={appDetails} />}
      endAction={<EditButton appDetails={appDetails} />}
      itemKind="app"
      isUnsynced={isAppUnsynced}
    />
  );
}
