import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button/Button';
import DashboardCard from './DashboardCard';

import type { FolderItem } from '../dummyData/types';
import type { TAppType } from '../helper';

interface FolderCardProps {
  folderDetails: FolderItem;
  appType: TAppType;
  onMoreClick?: () => void;
}

// Two-tone folder from Figma; Lucide has no filled two-color folder.
function FolderIllustration({ size = 18.33, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 16.3749) / 18.3341}
      viewBox="0 0 18.3341 16.3749"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M2.5 0.5H5.75977L5.90332 0.503906C6.19022 0.522385 6.4701 0.602625 6.72363 0.739258C7.01236 0.894862 7.25847 1.11962 7.44043 1.39355L7.44238 1.39648L8.11816 2.39648L8.12012 2.39941L8.125 2.40723V2.40625C8.24702 2.58913 8.41267 2.74003 8.60742 2.84375C8.80302 2.94782 9.02124 3.00042 9.24219 2.99902V3H15.833C16.3632 3 16.8719 3.21087 17.2471 3.58594C17.6222 3.96111 17.833 4.4697 17.833 5V13.333C17.833 13.8633 17.6222 14.3719 17.2471 14.7471C16.8719 15.1222 16.3633 15.333 15.833 15.333H2.5C1.9697 15.333 1.46111 15.1222 1.08594 14.7471C0.71087 14.3719 0.5 13.8632 0.5 13.333V2.5C0.5 1.9697 0.710768 1.46111 1.08594 1.08594C1.46111 0.710768 1.9697 0.5 2.5 0.5Z"
        className="tw-fill-folder-icon-back tw-stroke-folder-icon-back"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 13.8749V2.50007C0.5 2.50035 0.5 2.50007 0.5 2.50007C0.5 2.50007 0.336959 2.50007 1 2.50007H1.5H2.5C2.8603 2.52246 3.5 2.4985 4 2.50007C4.57423 2.50188 4.5 2.49876 5 2.50061C5.5 2.50246 6.5 2.50061 6.5 2.50061H7H7.5C7.5 2.50061 8.21769 2.50061 8.5 2.50061C8.74894 2.50061 9.36064 2.50198 9.5 2.50061H16C16.663 2.50061 17.6359 2.77188 18 3.5C18.3641 4.22812 18.3333 4.87848 18.3333 5.54152V13.8749C18.3333 14.5379 18.0698 15.1736 17.6009 15.6424C17.1321 16.1113 16.4964 16.3749 15.8333 16.3749H2.5C1.83696 16.3749 1.20126 16.1113 0.732422 15.6424C0.263581 15.1736 0 14.5379 0 13.8749Z"
        className="tw-fill-folder-icon-front"
      />
    </svg>
  );
}

export default function FolderCard({ folderDetails, appType }: FolderCardProps) {
  const { name, pinned } = folderDetails;

  const [, setSearchParams] = useSearchParams();

  const handleOpenFolder = () => {
    // Functional update keeps unrelated params such as `branch`, sort and filters.
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('folder', name);
        return next;
      },
      { replace: true }
    );
  };

  return (
    <DashboardCard
      itemDetails={folderDetails}
      appType={appType}
      icon={<FolderIllustration size={20} className="tw-p-px" />}
      pinned={pinned}
      endAction={
        <Button isLucid variant="secondary" size="medium" trailingIcon="arrow-right" onClick={handleOpenFolder}>
          Open
        </Button>
      }
      itemKind="folder"
    />
  );
}
