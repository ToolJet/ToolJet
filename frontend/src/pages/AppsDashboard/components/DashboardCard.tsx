import React, { type ReactNode } from 'react';

import { Button } from '@/components/ui/Button/Button';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';

interface DashboardCardProps {
  name: string;
  description: string;
  /** Shown at rest; replaced by the action row on hover or focus. */
  header: ReactNode;
  /** Left-aligned action; the rest of the row is right-aligned. */
  startAction?: ReactNode;
  endAction: ReactNode;
  onMoreClick?: () => void;
}

export default function DashboardCard({
  name,
  description,
  header,
  startAction,
  endAction,
  onMoreClick,
}: DashboardCardProps) {
  return (
    <div className="tw-group tw-flex tw-h-[104px] tw-min-w-0 tw-flex-col tw-justify-between tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-p-4 hover:tw-shadow-elevation-200">
      <div className="tw-flex tw-items-center tw-justify-between group-focus-within:tw-hidden group-hover:tw-hidden">
        {header}
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
        <TruncatedText content={name} className="tw-m-0 tw-font-title-large tw-text-text-default">
          {name}
        </TruncatedText>
        <p className="tw-m-0 tw-truncate tw-font-body-default tw-text-text-placeholder">{description}</p>
      </div>
      {/* sr-only rather than hidden so the buttons stay tabbable; focusing one reveals the row via focus-within. */}
      <div className="tw-sr-only tw-flex tw-items-center tw-justify-between group-focus-within:tw-not-sr-only group-focus-within:tw-flex group-hover:tw-not-sr-only group-hover:tw-flex">
        {startAction ?? <span />}
        <div className="tw-flex tw-items-center tw-gap-[7px]">
          {endAction}
          <Button
            variant="outline"
            size="medium"
            iconOnly
            isLucid
            leadingIcon="ellipsis-vertical"
            aria-label={`More actions for ${name}`}
            onClick={onMoreClick}
          />
        </div>
      </div>
    </div>
  );
}
