import { useCallback } from 'react';
import useTableStore from '../_stores/tableStore';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { shallow } from 'zustand/shallow';

const EMPTY_ARRAY = [];

export const useTableRefresh = (id, fireEvent = () => {}) => {
  const { moduleId } = useModuleContext();

  const isRefreshing = useTableStore((state) => state.getIsRefreshing(id), shallow);
  const setIsRefreshing = useTableStore((state) => state.setIsRefreshing);

  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const currentMode = useStore((state) => state.modeStore?.modules?.[moduleId]?.currentMode ?? 'edit');
  const dataQueries = useStore((state) => state.dataQuery.queries.modules?.[moduleId] ?? EMPTY_ARRAY, shallow);

  const getDependents = useStore((state) => state.getDependents);

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    const dataDeps = getDependents(`components.${id}.properties.data`, moduleId);
    const selectorDeps = getDependents(`components.${id}.properties.dataSourceSelector`, moduleId);
    const allDeps = [...new Set([...dataDeps, ...selectorDeps])];

    const seen = new Set();
    const queriesToRun = [];

    for (const dep of allDeps) {
      if (!dep.startsWith('queries.')) continue;
      const queryId = dep.split('.')[1];
      if (!queryId || seen.has(queryId)) continue;
      seen.add(queryId);
      const query = dataQueries.find((dq) => dq.id === queryId);
      if (query) queriesToRun.push(query);
    }

    if (queriesToRun.length === 0) {
      fireEvent('onRefresh');
      return;
    }

    setIsRefreshing(id, true);
    const runPromises = queriesToRun.map((query) =>
      runQuery(query.id, query.name, undefined, currentMode, {}, undefined, undefined, false, false, moduleId)
    );

    Promise.allSettled(runPromises).finally(() => {
      fireEvent('onRefresh');
      setIsRefreshing(id, false);
    });
  }, [id, moduleId, isRefreshing, getDependents, dataQueries, currentMode, runQuery, setIsRefreshing, fireEvent]);

  return { handleRefresh, isRefreshing };
};
