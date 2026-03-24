import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function SearchBar({ searchTerm, onSearchChange, classes = null, placeholder = 'Search' }) {
  return (
    <div
      className={cn(
        'tw-border tw-border-solid tw-border-border-weak focus-within:tw-border-border-accent-strong tw-rounded-md tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-w-full',
        classes?.searchInputContainer
      )}
    >
      <Search size={16} color="var(--icon-default)" />

      <input
        type="text"
        name="search-input"
        value={searchTerm}
        onChange={onSearchChange}
        placeholder={placeholder}
        className="tw-flex-1 tw-text-body-large tw-text-text-default placeholder:tw-text-text-placeholder tw-border-0 tw-outline-0 tw-bg-transparent tw-overflow-ellipsis tw-overflow-hidden tw-whitespace-nowrap tw-p-0"
      />
    </div>
  );
}

export function useSearch({ debounceDelay = 0 } = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    if (debounceDelay <= 0) return;

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceDelay]);

  return { searchTerm, setSearchTerm, debouncedSearchTerm };
}
