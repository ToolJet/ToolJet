import React, { useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getDeleteBlockers } from '@/AppBuilder/_utils/entityUsage';
import EntityDeleteDialog from '@/AppBuilder/Shared/EntityDelete/EntityDeleteDialog';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const DeleteWidgetConfirmation = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const showWidgetDeleteConfirmation = useStore((state) => state.showWidgetDeleteConfirmation, shallow);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation, shallow);
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const selectedComponents = useStore((state) => state.selectedComponents, shallow);
  const targets = useStore((state) => state.widgetDeleteConfirmationTargets, shallow);

  // Everything the dialog needs, computed once per opening: the components being
  // deleted and whatever still references them from outside the selection.
  const { componentIds, subjects, blockers, componentsById, queriesById } = useMemo(() => {
    if (!showWidgetDeleteConfirmation) {
      return { componentIds: [], subjects: [], blockers: [], componentsById: {}, queriesById: {} };
    }
    const state = useStore.getState();
    const ids = (targets ?? selectedComponents ?? [])
      .map((component) => (typeof component === 'string' ? component : component?.id))
      .filter(Boolean);
    const allComponents = state.getCurrentPageComponents(moduleId) ?? {};
    const queries = state.dataQuery?.queries?.modules?.[moduleId] ?? [];

    return {
      componentIds: ids,
      subjects: ids.map((id) => ({ id, name: allComponents[id]?.component?.name ?? id })),
      blockers: getDeleteBlockers(state, { componentIds: ids }, moduleId),
      componentsById: allComponents,
      queriesById: Object.fromEntries(queries.map((query) => [query.id, query])),
    };
  }, [showWidgetDeleteConfirmation, targets, selectedComponents, moduleId]);

  const close = () => setWidgetDeleteConfirmation(false);

  return (
    <EntityDeleteDialog
      show={showWidgetDeleteConfirmation}
      entityLabel="component"
      subjects={subjects}
      blockers={blockers}
      componentsById={componentsById}
      queriesById={queriesById}
      onCancel={close}
      onConfirm={() => deleteComponents(componentIds, moduleId)}
      darkMode={darkMode}
    />
  );
};
