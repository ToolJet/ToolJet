import React from 'react';

import { Button } from '@/components/ui/Button/Button';
import RawAppIcon from '@/HomePage/AppIcon';
import DashboardCard from './DashboardCard';

// Untyped JS module — cast at the import site.
const AppIcon = RawAppIcon as React.ComponentType<{ icon?: string; color?: string; size?: number }>;

interface AppCardProps {
  name: string;
  /** Preformatted, e.g. "Edited 2 hours ago by user". */
  description: string;
  /** Legacy icon name stored on the app; see `HomePage/AppIcon.jsx`. */
  icon?: string;
  iconColor?: string;
  isPinned?: boolean;
  isUnsynced?: boolean;
  onLaunch?: () => void;
  onEdit?: () => void;
  onMoreClick?: () => void;
}

export default function AppCard({
  name,
  description,
  icon,
  isPinned = false,
  isUnsynced = false,
  onLaunch,
  onEdit,
}: AppCardProps) {
  return (
    <DashboardCard
      name={name}
      description={description}
      icon={<AppIcon icon={icon} color="blue" size={20} />}
      pinned={isPinned}
      startAction={
        <Button isLucid variant="ghost" size="medium" leadingIcon="play" onClick={onLaunch}>
          Launch
        </Button>
      }
      endAction={
        <Button isLucid variant="secondary" size="medium" leadingIcon="square-pen" onClick={onEdit}>
          Edit
        </Button>
      }
      itemKind="app"
      isUnsynced={isUnsynced}
    />
  );
}
