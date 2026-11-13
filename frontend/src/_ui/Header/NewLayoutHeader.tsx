import React from 'react';

import { cn } from '@/lib/utils';
import { OrganizationList } from '@/modules/dashboard/components';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import type { IFeatureAccess } from '@/_stores/types/licenseStore';

import { useHeaderSearch } from './useHeaderSearch';
import SearchInput from './SearchInput';
import HeaderEnvironmentSelect from './HeaderEnvironmentSelect';
import BranchingActionButtons from './BranchingActionButtons';

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

      <div className="tw-flex tw-items-center tw-justify-end tw-gap-2.5">
        {/* Shared by several pages: BranchingActionButtons decides for itself where git controls show. */}
        <BranchingActionButtons />
        {Object.keys(featureAccess).length > 0 && <LicenseBanner showNavBarActions limits={featureAccess} />}
        {/* The header's own 12px padding keeps it off the edge; the page that wants an environment select provides it. */}
        <HeaderEnvironmentSelect />
      </div>
    </header>
  );
}
