import React, { useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { getDeleteBlockers } from '@/AppBuilder/_utils/entityUsage';
import EntityDeleteDialog from '@/AppBuilder/Shared/EntityDelete/EntityDeleteDialog';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import type { DeleteSubject } from '@/AppBuilder/_utils/entityUsage';
import type { ComponentsById, QueriesById } from '@/AppBuilder/LeftSidebar/Dependencies/types';

export type QueryDeleteConfirmationProps = {
  darkMode?: boolean;
};

/** Resolved once per opening of the dialog. */
type QueryDeleteState = {
  query: any;
  subjects: Array<{ id: string; name: string }>;
  blockers: DeleteSubject[];
  componentsById: ComponentsById;
  queriesById: QueriesById;
};

/**
 * Delete confirmation for queries. Lives at the pane level rather than inside
 * QueryCard: the folder tree mounts cards through its own renderer, so a card can be
 * unmounted (collapsed folder, reorder) while its query is the one being deleted.
 */
export const QueryDeleteConfirmation = ({ darkMode }: QueryDeleteConfirmationProps) => {
  const { moduleId } = useModuleContext();
  const deletingQueryId = useStore((state: any) => state.queryPanel.deletingQueryId);
  const deleteDataQuery = useStore((state: any) => state.queryPanel.deleteDataQuery);
  const deleteDataQueries = useStore((state: any) => state.dataQuery.deleteDataQueries);
  const setPreviewData = useStore((state: any) => state.queryPanel.setPreviewData);

  // Query being deleted plus whatever still references it, resolved once per opening.
  const { query, subjects, blockers, componentsById, queriesById } = useMemo<QueryDeleteState>(() => {
    if (!deletingQueryId) return { query: null, subjects: [], blockers: [], componentsById: {}, queriesById: {} };
    const state = useStore.getState() as any;
    const queries = state.dataQuery?.queries?.modules?.[moduleId] ?? [];
    const target = queries.find((item: any) => item.id === deletingQueryId);

    return {
      query: target,
      subjects: target ? [{ id: target.id, name: target.name }] : [],
      blockers: getDeleteBlockers(state, { queryIds: [deletingQueryId] }, moduleId),
      componentsById: state.getCurrentPageComponents(moduleId) ?? {},
      queriesById: Object.fromEntries(queries.map((item: any) => [item.id, item])),
    };
  }, [deletingQueryId, moduleId]);

  if (!query) return null;

  const executeDataQueryDeletion = () => {
    deleteDataQuery(null);
    deleteDataQueries(deletingQueryId);
    setPreviewData(null);
  };

  return (
    <EntityDeleteDialog
      show
      entityLabel="query"
      subjects={subjects}
      blockers={blockers}
      componentsById={componentsById}
      queriesById={queriesById}
      darkMode={darkMode}
      onCancel={() => deleteDataQuery(null)}
      onConfirm={executeDataQueryDeletion}
    />
  );
};

export default QueryDeleteConfirmation;
