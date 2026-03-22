import React, { useEffect } from 'react';

import { useSearch } from '@/pages/shared/SearchBar';
import { useAppsStore } from '@/pages/shared/store';

import SearchBar from './SearchBar';
import WorkspaceSelector from './WorkspaceSelector';

export default function Header() {
  const setAppSearchQuery = useAppsStore((state) => state.setAppSearchQuery);

  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useSearch({ debounceDelay: 500 });

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    setAppSearchQuery(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(
    () => () => {
      setSearchTerm('');
      setAppSearchQuery('');
    },
    []
  );

  return (
    <header className="tw-grid tw-grid-cols-3 tw-items-center tw-h-12 tw-border-b tw-border-border-weak tw-pl-3 tw-pr-8">
      <WorkspaceSelector />

      <SearchBar
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        classes={{ searchBarContainer: 'tw-mx-auto' }}
      />
    </header>
  );
}
