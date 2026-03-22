import React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Rocket/input';

export default function SearchBar({ searchTerm, onSearchTermChange, placeholder = 'Search', classes = null }) {
  return (
    <div className={cn('tw-group tw-relative tw-w-[180px]', classes?.searchBarContainer)}>
      <Input
        size="small"
        type="text"
        value={searchTerm}
        placeholder={placeholder}
        onChange={onSearchTermChange}
        className="tw-pl-20 tw-pr-4 tw-py-1 tw-h-8 !tw-font-body-default tw-bg-background-surface-layer-01 tw-border-transparent focus-visible:tw-outline-0 hover:tw-bg-interactive-hover focus:tw-border-border-accent-strong focus:tw-pl-7 tw-transition-all tw-duration-200"
      />
      <Search
        size={14}
        className="tw-absolute tw-left-16 group-focus-within:!tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-icon-default tw-pointer-events-none tw-transition-all tw-duration-200"
      />
    </div>
  );
}
