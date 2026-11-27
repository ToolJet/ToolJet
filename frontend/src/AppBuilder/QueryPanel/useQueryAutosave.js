import { useEffect } from 'react';
import { isEmpty, isEqual } from 'lodash';
import { diff } from 'deep-object-diff';
import useStore from '@/AppBuilder/_stores/store';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

// Saves the selected query whenever the user edits it. Mounted once per surface that shows the query
// editor: the app builder's runtime panel and the Query Library page.
export default function useQueryAutosave() {
  useEffect(() => {
    const unsubscribe = useStore.subscribe(({ queryPanel: { selectedQuery, queryHydrationRevision } }, prevState) => {
      // Restoring server content establishes the editor baseline; it is not a user edit.
      if (queryHydrationRevision !== prevState.queryPanel.queryHydrationRevision) return;
      if (isEmpty(prevState?.queryPanel?.selectedQuery) || isEmpty(selectedQuery)) return;
      if (prevState?.queryPanel?.selectedQuery?.id !== selectedQuery.id) return;
      const formattedQuery = deepClone(selectedQuery);
      const formattedPreviousQuery = deepClone(prevState?.queryPanel?.selectedQuery || {});
      delete formattedQuery.updated_at;
      delete formattedPreviousQuery.updated_at;
      const queryDiff = diff(formattedPreviousQuery, formattedQuery);
      const onlyNameChanged = Object.keys(queryDiff).length === 1 && 'name' in queryDiff;
      if (!isEqual(formattedQuery, formattedPreviousQuery) && !onlyNameChanged) {
        useStore.getState().dataQuery.saveData(selectedQuery);
      }
    });
    return unsubscribe;
  }, []);
}
