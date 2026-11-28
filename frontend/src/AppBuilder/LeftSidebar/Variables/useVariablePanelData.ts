import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { definitionsOf, normalizeVariableDefinitionMap } from '@/AppBuilder/_utils/variableDefinitions';
import { buildVariableRows } from './variableRows';
import type { StoredVariableMap } from './variableRows';

/** Shared data for the left list and its independently mounted contextual right panel. */
export const useVariablePanelData = (moduleId: string) => {
  const rawAppMap = useStore((state: any) => state.getGlobalSettings(moduleId)?.variables);
  const { rawPageMap, pageName, pageId } = useStore((state: any) => {
    const pageId = state.getCurrentPageId(moduleId);
    const page = state.modules[moduleId]?.pages?.find((p: any) => p.id === pageId);
    return { rawPageMap: page?.variables, pageName: page?.name ?? 'this page', pageId };
  }, shallow);
  const versionId = useStore((state: any) => state.currentVersionId);
  const isModule = useStore((state: any) => state.getAppType(moduleId) === 'module');
  const appMap = useMemo(() => normalizeVariableDefinitionMap(rawAppMap) as StoredVariableMap, [rawAppMap]);
  const pageMap = useMemo(() => normalizeVariableDefinitionMap(rawPageMap) as StoredVariableMap, [rawPageMap]);
  const queries = useStore((state: any) => state.dataQuery.queries.modules[moduleId]);
  const events = useStore((state: any) => state.eventsSlice.module[moduleId]?.events);
  const liveApp = useStore((state: any) => state.resolvedStore.modules[moduleId]?.exposedValues?.variables);
  const livePage = useStore((state: any) => state.resolvedStore.modules[moduleId]?.exposedValues?.page?.variables);
  const liveAppKeys = Object.keys(liveApp ?? {}).join('|');
  const livePageKeys = Object.keys(livePage ?? {}).join('|');
  const rows = useMemo(
    () => buildVariableRows(useStore.getState(), moduleId, appMap ?? {}, pageMap ?? {}),
    // Values update independently; rebuilding rows is needed only for declarations/references/new runtime keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appMap, pageMap, queries, events, liveAppKeys, livePageKeys, moduleId, pageId]
  );
  const definitions = useMemo(
    () => [...definitionsOf(appMap, 'app'), ...definitionsOf(pageMap, 'page')],
    [appMap, pageMap]
  );
  return { rows, definitions, liveApp, livePage, pageName, pageId, versionId, isModule };
};
