import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import RawAppIcon from '@/pages/AppsDashboard/components/AppIcon';
import DashboardCard from './DashboardCard';
import LaunchButton from './LaunchButton';

import type { AppItem } from '../dummyData/types';
import type { TAppType } from '../helper';

// Untyped JS module — cast at the import site.
const AppIcon = RawAppIcon as React.ComponentType<{ icon?: string; color?: string; size?: number }>;

interface AppCardProps {
  appDetails: AppItem;
  appType: TAppType;
  onLaunch?: () => void;
  onEdit?: () => void;
  onMoreClick?: () => void;
}

export default function AppCard({ appDetails, appType, onLaunch, onEdit }: AppCardProps) {
  const { icon, pinned, git, actions } = appDetails;

  return (
    <DashboardCard
      itemDetails={appDetails}
      appType={appType}
      icon={<AppIcon icon={icon} color="blue" size={20} />}
      pinned={pinned}
      startAction={<LaunchButton launch={actions.launch} onLaunch={onLaunch} />}
      endAction={
        <Button isLucid variant="secondary" size="medium" leadingIcon="square-pen" onClick={onEdit}>
          Edit
        </Button>
      }
      itemKind="app"
      isUnsynced={git?.synced === false}
    />
  );
}
