import React from 'react';

import { cn } from '@/lib/utils';

export default function PageHeader({ children, title, classes = null }) {
  return (
    <header className="tw-flex tw-justify-between tw-items-center tw-gap-4">
      <h1 className="tw-text-text-medium tw-text-[22px] tw-font-inter tw-font-medium tw-leading-9 tw-tracking-[var(--letter-spacing-display-medium)]">
        {title}
      </h1>

      {children}
    </header>
  );
}
