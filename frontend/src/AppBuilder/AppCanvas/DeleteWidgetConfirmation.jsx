import React, { useMemo } from 'react';
import { ConfirmDialog } from '@/_components/ConfirmDialog';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { getComponentUsage } from '@/AppBuilder/_utils/entityUsage';
import EntityUsageList from '@/AppBuilder/Shared/EntityUsage/EntityUsageList';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

export const DeleteWidgetConfirmation = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const showWidgetDeleteConfirmation = useStore((state) => state.showWidgetDeleteConfirmation, shallow);
  const setWidgetDeleteConfirmation = useStore((state) => state.setWidgetDeleteConfirmation, shallow);
  const deleteComponents = useStore((state) => state.deleteComponents, shallow);
  const selectedComponents = useStore((state) => state.selectedComponents, shallow);

  // Entities that reference the to-be-deleted components (excluding anything
  // that is itself part of the selection). Computed only while the dialog is open.
  const dependents = useMemo(() => {
    if (!showWidgetDeleteConfirmation) return [];
    const state = useStore.getState();
    const selectedIds = new Set(
      (selectedComponents || []).map((component) => (typeof component === 'string' ? component : component?.id))
    );
    const seen = new Map();
    selectedIds.forEach((componentId) => {
      if (!componentId) return;
      const usage = getComponentUsage(state, componentId, moduleId);
      usage.usedBy.forEach((entry) => {
        if (entry.kind === 'component' && selectedIds.has(entry.id)) return;
        const key = `${entry.kind}:${entry.id ?? entry.name}`;
        if (!seen.has(key)) seen.set(key, entry);
      });
    });
    return Array.from(seen.values());
  }, [showWidgetDeleteConfirmation, selectedComponents, moduleId]);

  const handleConfirmDelete = () => {
    deleteComponents();
  };

  const message =
    dependents.length === 0 ? (
      'Are you sure you want to delete this component?'
    ) : (
      <div className="delete-widget-dependents">
        <div className="delete-widget-dependents-warning" data-cy="delete-widget-dependents-warning">
          Deleting will break {dependents.length} reference{dependents.length === 1 ? '' : 's'}:
        </div>
        <div className="delete-widget-dependents-list">
          <EntityUsageList groups={[{ title: 'Used by', entries: dependents }]} readOnly />
        </div>
        <div className="delete-widget-dependents-question">Delete anyway?</div>
      </div>
    );

  return (
    <ConfirmDialog
      show={showWidgetDeleteConfirmation}
      message={message}
      onConfirm={handleConfirmDelete}
      onCancel={() => setWidgetDeleteConfirmation(false)}
      darkMode={darkMode}
    />
  );
};
