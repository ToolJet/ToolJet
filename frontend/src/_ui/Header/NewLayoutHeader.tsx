import React from 'react';

import { cn } from '@/lib/utils';
import { OrganizationList } from '@/modules/dashboard/components';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import type { IFeatureAccess } from '@/_stores/types/licenseStore';

import { useHeaderSearch } from './useHeaderSearch';
import SearchInput from './SearchInput';

export default function NewLayoutHeader({ featureAccess }: { featureAccess: IFeatureAccess }) {
  const searchProps = useHeaderSearch();

  return (
    <header
      className={cn(
        'tw-grid tw-grid-cols-3 tw-items-center tw-h-12 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-3'
      )}
    >
      <OrganizationList variant="v2" />

      <SearchInput {...searchProps} />

      <div className="tw-flex tw-justify-end tw-items-center tw-gap-2.5">
        {Object.keys(featureAccess).length > 0 && <LicenseBanner showNavBarActions limits={featureAccess} />}
      </div>
    </header>
  );
}
