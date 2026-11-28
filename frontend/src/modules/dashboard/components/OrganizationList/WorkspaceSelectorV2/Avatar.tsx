import React from 'react';

import { cn } from '@/lib/utils';
import { getAvatar } from '@/_helpers/utils';

interface AvatarProps {
  workspaceName: string;
  classes?: {
    /** Merged into the tile, e.g. to change its size or radius. */
    avatarContainer?: string;
    /** Merged into the initials. */
    avatarText?: string;
  } | null;
}

// Workspaces store no color, so every workspace gets the same neutral initials tile.
export default function Avatar({ workspaceName, classes = null }: AvatarProps) {
  return (
    <div
      data-cy={`${String(workspaceName).toLowerCase().replace(/\s+/g, '-')}-avatar`}
      className={cn(
        'tw-flex tw-justify-center tw-items-center tw-uppercase tw-bg-interactive-hover tw-rounded tw-size-6',
        classes?.avatarContainer
      )}
    >
      <span className={cn('tw-font-body-small tw-text-text-placeholder', classes?.avatarText)}>
        {getAvatar(workspaceName)}
      </span>
    </div>
  );
}
