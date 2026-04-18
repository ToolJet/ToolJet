import { useEffect, useState } from 'react';

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
