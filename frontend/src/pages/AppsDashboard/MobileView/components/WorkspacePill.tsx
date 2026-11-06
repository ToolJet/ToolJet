import React from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { decodeEntities } from '@/_helpers/utils';
import Avatar from '@/modules/dashboard/components/OrganizationList/WorkspaceSelectorV2/Avatar';

interface WorkspacePillProps {
  workspaceName: string;
  disabled?: boolean;
  onClick: () => void;
}

export function WorkspacePill({ workspaceName, disabled = false, onClick }: WorkspacePillProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`Switch workspace, current: ${workspaceName}`}
      className={cn(
        'tw-flex tw-h-11 tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-py-0 tw-pl-1.5 tw-pr-3 tw-shadow-elevation-100',
        disabled && 'tw-opacity-50'
      )}
      onClick={onClick}
    >
      <Avatar
        workspaceName={workspaceName}
        classes={{ avatarContainer: 'tw-size-7 tw-shrink-0 tw-rounded-full', avatarText: 'tw-font-title-default' }}
      />

      <span className="tw-font-title-x-large tw-text-text-default tw-truncate tw-max-w-24">
        {decodeEntities(workspaceName)}
      </span>

      <ChevronDown aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-strong" />
    </button>
  );
}
