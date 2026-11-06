import React from 'react';

import RawAppIcon from '@/pages/AppsDashboard/components/AppIcon';
import DashboardCard from './DashboardCard';
import EditButton from './EditButton';
import LaunchButton from './LaunchButton';

import type { AppItem } from '../dummyData/types';
import type { TAppType } from '../helper';

// Untyped JS module — cast at the import site.
const AppIcon = RawAppIcon as React.ComponentType<{ icon?: string; color?: string; size?: number }>;

interface AppCardProps {
  appDetails: AppItem;
  appType: TAppType;
  /** Tags the card with its folder's name; used where nested apps are listed beside stray ones. */
  showFolderTag?: boolean;
  onMoreClick?: () => void;
}

export default function AppCard({ appDetails, appType, showFolderTag = false }: AppCardProps) {
  const { icon, pinned } = appDetails;

  return (
    <DashboardCard
      itemDetails={appDetails}
      appType={appType}
      icon={<AppIcon icon={icon} color="blue" size={20} />}
      pinned={pinned}
      folderName={showFolderTag ? appDetails.folder?.name : undefined}
      startAction={<LaunchButton appDetails={appDetails} />}
      endAction={<EditButton appDetails={appDetails} />}
      itemKind="app"
    />
  );
}
