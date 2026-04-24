import React from 'react';
import { QueryCard } from './QueryCard';

// CE stub — renders the flat query list unchanged.
// EE replaces this with the full SortableTree folder view.
export function QueryFolderTree({ filteredQueries, darkMode, isDataSourceLocal }) {
  return (
    <>
      {filteredQueries.map((query) => (
        <QueryCard key={query.id} dataQuery={query} darkMode={darkMode} localDs={!!isDataSourceLocal(query)} />
      ))}
    </>
  );
}
