import { useEffect, useState } from 'react';
import { useLatest } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

const SEARCH_DEBOUNCE_MS = 300;

/** The Table's search: the text in the box (`searchInput`), the search applied after a typing pause (`searchText`,
 *  published with onSearch and page 1), and `searchNow` for the setSearchText action, which applies at once. */
export const useTableSearch = (
  setPage: (page: number) => void,
  setExposedVariables: WidgetProps['setExposedVariables'],
  fireEvent: WidgetProps['fireEvent']
) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchText, setSearchText] = useState('');
  // Read through refs: a new callback from RenderWidget must not restart the search pause.
  const publish = useLatest(setExposedVariables);
  const fire = useLatest(fireEvent);
  const apply = (text: string) => {
    setSearchText(text);
    setPage(1);
    publish.current({ searchText: text, pageIndex: 1 });
    fire.current('onSearch');
  };
  const applyLatest = useLatest(apply);
  useEffect(() => {
    if (searchInput === searchText) return undefined;
    const timer = setTimeout(() => applyLatest.current(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, searchText, applyLatest]);
  const searchNow = (text: string) => {
    setSearchInput(text);
    apply(text);
  };
  return { searchInput, setSearchInput, searchText, searchNow };
};
