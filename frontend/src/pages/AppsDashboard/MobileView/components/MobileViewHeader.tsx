import React from 'react';

import { MobileSearchInput, type MobileSearchInputProps } from './MobileSearchInput';

interface MobileViewHeaderProps {
  /** Left of the top bar: the workspace pill at the root, the back button in a folder. */
  leading: React.ReactNode;
  /** Right of the top bar, e.g. the Edit button. */
  trailing?: React.ReactNode;
  /** The page heading: the title at the root, the breadcrumb in a folder. */
  title: React.ReactNode;
  /** Search input props; null hides the input when there is nothing to search. */
  search: MobileSearchInputProps | null;
  /** Rows under the search, e.g. the banner and the item count. */
  children?: React.ReactNode;
}

// The top of both mobile views, so they line up when navigating between root and a folder.
export function MobileViewHeader({ leading, trailing, title, search, children }: MobileViewHeaderProps) {
  return (
    <>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        {leading}
        {trailing}
      </div>

      <div className="tw-space-y-3 tw-mt-2">
        {title}
        {search && <MobileSearchInput {...search} />}
        {children}
      </div>
    </>
  );
}
