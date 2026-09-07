import React, { useEffect, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getDeleteBlockers } from '@/AppBuilder/_utils/entityUsage';
import EntityDeleteDialog from '@/AppBuilder/Shared/EntityDelete/EntityDeleteDialog';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

/**
 * `showWidgetDeleteConfirmation` and its targets are single, app-wide values, but this
 * component is mounted by AppCanvas — and AppCanvas is mounted once per module canvas on
 * the page:
 *
 *   AppBuilder      → ModuleProvider moduleId='canvas' → AppCanvas → this   (owns the flag)
 *   ModuleContainer → ModuleViewer → Viewer moduleId={id}
 *                   → ModuleProvider moduleId={id}     → AppCanvas → this   (must stay quiet)
 *
 * Every instance saw the same flag flip, so a page containing a module opened two dialogs
 * at once. The nested one looked the selected id up in the *module's* components, missed,
 * fell back to printing the raw UUID, found no blockers there, and so offered a live Delete
 * that would have run against the wrong moduleId.
 *
 * The editor — app or module editor — always uses moduleId 'canvas' (AppBuilder's default),
 * so that is what identifies the canvas owning the selection.
 */
const OWNING_MODULE_ID = 'canvas';

export const DeleteWidgetConfirmation = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const isOwningCanvas = moduleId === OWNING_MODULE_ID;
  const showWidgetDeleteConfirmation = useStore((state) => state.showWidgetDeleteConfirmation, shallow);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation, shallow);
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const deleteTargetIsModuleEditor = useStore((state) => state.deleteTargetIsModuleEditor, shallow);
  const selectedComponents = useStore((state) => state.selectedComponents, shallow);
  const targets = useStore((state) => state.widgetDeleteConfirmationTargets, shallow);

  // Everything the dialog needs, computed once per opening: the components being
  // deleted and whatever still references them from outside the selection.
  const { componentIds, subjects, blockers, componentsById, queriesById } = useMemo(() => {
    if (!showWidgetDeleteConfirmation || !isOwningCanvas) {
      return { componentIds: [], subjects: [], blockers: [], componentsById: {}, queriesById: {} };
    }
    const state = useStore.getState();
    const allComponents = state.getCurrentPageComponents(moduleId) ?? {};
    const ids = (targets ?? selectedComponents ?? [])
      .map((component) => (typeof component === 'string' ? component : component?.id))
      // Only ids this canvas actually owns. A stale or foreign id would otherwise become a
      // subject with no resolvable name and no discoverable dependents — i.e. a dialog
      // offering to delete something it knows nothing about.
      .filter((id) => id && allComponents[id]);
    const queries = state.dataQuery?.queries?.modules?.[moduleId] ?? [];

    return {
      componentIds: ids,
      subjects: ids.map((id) => ({ id, name: allComponents[id]?.component?.name })),
      blockers: getDeleteBlockers(state, { componentIds: ids }, moduleId),
      componentsById: allComponents,
      queriesById: Object.fromEntries(queries.map((query) => [query.id, query])),
    };
  }, [showWidgetDeleteConfirmation, isOwningCanvas, targets, selectedComponents, moduleId]);

  const close = () => setWidgetDeleteConfirmation(false);

  // Nothing left to confirm — every target was stale or belongs to another canvas. Clear the
  // flag rather than rendering an empty dialog: it is app-wide, and HotkeyProvider keeps
  // canvas shortcuts disabled while it is set, so leaving it raised with no dialog on screen
  // would strand the user with no way to lower it.
  useEffect(() => {
    if (isOwningCanvas && showWidgetDeleteConfirmation && componentIds.length === 0) {
      setWidgetDeleteConfirmation(false);
    }
  }, [isOwningCanvas, showWidgetDeleteConfirmation, componentIds.length, setWidgetDeleteConfirmation]);

  if (!isOwningCanvas) return null;

  return (
    <EntityDeleteDialog
      show={showWidgetDeleteConfirmation && componentIds.length > 0}
      entityLabel="component"
      subjects={subjects}
      blockers={blockers}
      componentsById={componentsById}
      queriesById={queriesById}
      onCancel={close}
      onConfirm={() => deleteComponents(componentIds, moduleId, { isModuleEditor: deleteTargetIsModuleEditor })}
      darkMode={darkMode}
    />
  );
};
