import React from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Merged over the default side margin (the 70px page gutter), e.g. `tw-mx-4` for a narrower page. */
  className?: string;
}

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('tw-flex tw-items-center tw-justify-between tw-gap-4 tw-mx-[4.375rem]', className)}>
      <div className="tw-min-w-0">
        <h1 className="tw-m-0 tw-truncate tw-font-inter tw-font-medium tw-text-[1.375rem] tw-leading-relaxed tw-tracking-[var(--letter-spacing-display-medium)] tw-text-text-medium">
          {title}
        </h1>

        {description && <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">{description}</p>}
      </div>

      {actions && <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">{actions}</div>}
    </header>
  );
}
