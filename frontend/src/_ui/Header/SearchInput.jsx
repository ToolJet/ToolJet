import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSearchStore } from '@/_stores/searchStore';
import { Input } from '@/components/ui/Rocket/Input/Input';

export default function SearchInput({ classes = null }) {
  const timeoutIdRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const placeholder = useSearchStore((state) => state.placeholder);
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const clearSearchQuery = useSearchStore((state) => state.clearSearchQuery);
  const setClearSearchQuery = useSearchStore((state) => state.setClearSearchQuery);

  useEffect(() => {
    timeoutIdRef.current = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutIdRef.current);
  }, [searchTerm, setSearchQuery]);

  useEffect(() => {
    if (clearSearchQuery) {
      setSearchTerm('');
      setClearSearchQuery(false);
    }
  }, [clearSearchQuery, setClearSearchQuery]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={cn('tw-group tw-relative tw-w-[180px]', classes?.searchBarContainer)}>
      <Input
        size="small"
        type="text"
        data-cy="header-search-bar"
        value={searchTerm}
        placeholder={placeholder}
        onChange={handleSearchChange}
        className="tw-pl-20 tw-pr-4 tw-py-1 tw-h-8 !tw-font-body-default tw-bg-background-surface-layer-01 tw-border-0 tw-outline-0 hover:tw-bg-interactive-hover focus:tw-bg-interactive-hover focus:tw-pl-7 tw-transition-all tw-duration-200"
      />

      <Search
        size={14}
        className="tw-absolute tw-left-16 group-focus-within:!tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-icon-default tw-pointer-events-none tw-transition-all tw-duration-200"
      />
    </div>
  );
}
