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
  onMoreClick?: () => void;
}

export default function AppCard({ appDetails, appType }: AppCardProps) {
  const { icon, pinned } = appDetails;

  return (
    <DashboardCard
      itemDetails={appDetails}
      appType={appType}
      icon={<AppIcon icon={icon} color="blue" size={20} />}
      pinned={pinned}
      startAction={<LaunchButton appDetails={appDetails} />}
      endAction={<EditButton appDetails={appDetails} />}
      itemKind="app"
    />
  );
}
