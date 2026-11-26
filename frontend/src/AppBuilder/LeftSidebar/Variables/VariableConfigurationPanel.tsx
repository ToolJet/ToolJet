import React, { useEffect, useState } from 'react';
import { CopyIcon, Trash2Icon, WaypointsIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import RawPanelHeader from '@/AppBuilder/Shared/Panel/PanelHeader';
import { getPanelCloseLabel } from '@/AppBuilder/panelLayout';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { copyToClipboard } from '@/_helpers/appUtils';
import { DetailMenu } from '../Dependencies/DetailTab';
import { EntityIcon } from '../Dependencies/entityIcons';
import { CreateVariableForm, EditVariableForm, RuntimeVariableDetail } from './VariableEditor';
import VariableReferencesDialog, { computeVariableReferences } from './VariableReferencesDialog';
import { previewOf, referenceOf, rowKey } from './variableRows';
import { useVariablePanelData } from './useVariablePanelData';
import type { VariableRow, VariableScope } from './variableRows';
import type { VariableReference } from './variableReferences';
import './styles.scss';

const PanelHeader = RawPanelHeader as React.ComponentType<any>;
const variableIcon = <EntityIcon kind="variable" size={16} />;

const LiveValue = ({ moduleId, scope, name }: { moduleId: string; scope: VariableScope; name: string }) => {
  const value = useStore((state: any) => {
    const exposed = state.resolvedStore.modules[moduleId]?.exposedValues;
    return previewOf(scope === 'app' ? exposed?.variables?.[name] : exposed?.page?.variables?.[name], 220);
  });
  return <>{value}</>;
};

/** Contextual create/details surface. It must survive the left resource list being closed or replaced. */
const VariableConfigurationPanel = ({
  moduleId,
  darkMode = false,
  exiting = false,
}: {
  moduleId: string;
  darkMode?: boolean;
  exiting?: boolean;
}) => {
  const context = useStore((state: any) => state.variablePanelContext);
  const active = useStore(
    (state: any) => state.isRightSidebarOpen && state.activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.VARIABLES
  );
  const readOnly = useStore((state: any) => state.getShouldFreeze());
  const close = useStore((state: any) => state.closeVariablePanel);
  const open = useStore((state: any) => state.openVariablePanel);
  const showSaved = useStore((state: any) => state.showSavedVariablePanel);
  const deleteDefinition = useStore((state: any) => state.deleteVariableDefinition);
  const viewDependencies = useStore((state: any) => state.setEntityToViewDependencies);
  const { rows, definitions, pageName, pageId, versionId } = useVariablePanelData(moduleId);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState<{ context: any; row: VariableRow } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ row: VariableRow; references: VariableReference[] } | null>(
    null
  );
  const stale =
    context &&
    (context.moduleId !== moduleId ||
      context.versionId !== versionId ||
      ((context.scope === 'page' || context.mode === 'create') && context.pageId !== pageId));
  const foundRow =
    context?.mode === 'detail'
      ? rows[context.scope as VariableScope].find((row) => row.name === context.name)
      : undefined;
  // The old name can remain as an inferred runtime-only row during an optimistic rename.
  // Keep the editing form mounted until the save succeeds or its error can be shown.
  const selectedRow = foundRow?.definition ? foundRow : renaming?.context === context ? renaming.row : foundRow;
  const runtimeRow = context?.runtimeKey
    ? [...rows.app, ...rows.page].find((row) => row.key === context.runtimeKey)
    : undefined;

  useEffect(() => {
    setPendingDelete(null);
  }, [context]);

  useEffect(() => {
    if (active && (stale || (context?.mode === 'detail' && !selectedRow && !deleting))) close(context);
  }, [active, stale, context, selectedRow, deleting, close]);

  if ((!active && !exiting) || !context || stale) return null;

  const deleteRow = async (row: VariableRow) => {
    if (readOnly || deleting) return;
    setDeleting(true);
    const result = await deleteDefinition(row.scope, row.name, moduleId);
    setDeleting(false);
    if (!result.ok) return;
    toast.success(`Deleted ${row.name}`);
    setPendingDelete(null);
    close(context);
  };
  const requestDelete = (row: VariableRow) => {
    if (readOnly) return;
    const references = computeVariableReferences(moduleId, row.scope, row.name);
    if (!references.length) deleteRow(row);
    else setPendingDelete({ row, references });
  };
  const menuItems = selectedRow
    ? [
        {
          label: 'Copy reference',
          icon: <CopyIcon size={16} />,
          onClick: () => copyToClipboard(referenceOf(selectedRow.scope, selectedRow.name)),
        },
        {
          label: 'View in Dependencies',
          icon: <WaypointsIcon size={16} />,
          onClick: () => viewDependencies({ kind: 'variable', id: rowKey(selectedRow.scope, selectedRow.name) }),
        },
        ...(selectedRow.definition && !readOnly
          ? [
              {
                label: 'Delete variable',
                destructive: true,
                icon: <Trash2Icon size={16} />,
                onClick: () => requestDelete(selectedRow),
              },
            ]
          : []),
      ]
    : [];
  const title = context.mode === 'create' ? (runtimeRow ? 'Initial value' : 'New variable') : context.name;

  return (
    <div
      className={`variable-configuration-panel ${darkMode ? 'dark-theme' : ''}`}
      data-cy="variable-configuration-panel"
    >
      <PanelHeader
        title={title}
        titleDataCy="variable-configuration-title"
        leading={<span className="variables-header-icon">{variableIcon}</span>}
        onClose={() => close(context)}
        closeLabel={getPanelCloseLabel('variable')}
        closeDataCy="variable-configuration-close"
      >
        <DetailMenu items={menuItems} darkMode={darkMode} />
      </PanelHeader>
      <div className="variables-body">
        {context.mode === 'create' ? (
          <CreateVariableForm
            key={`${context.revision}:${context.versionId}:${context.pageId}:${context.scope}:${context.runtimeKey ?? 'new'}`}
            moduleId={moduleId}
            pageName={pageName}
            definitions={definitions}
            initialScope={context.scope}
            runtimeVariable={runtimeRow}
            onCreated={(scope, name) => showSaved(context, scope, name)}
          />
        ) : selectedRow?.definition ? (
          <EditVariableForm
            key={`${context.revision}:${context.versionId}:${context.pageId}:${selectedRow.scope}:${selectedRow.name}`}
            moduleId={moduleId}
            pageName={pageName}
            definitions={definitions}
            row={selectedRow}
            onRenamed={(scope, name) => showSaved(context, scope, name)}
            onRenameSaving={(saving) =>
              setRenaming((current) => (saving && selectedRow ? { context, row: selectedRow } : current))
            }
          />
        ) : selectedRow ? (
          <>
            <div className="variables-detail-value">
              <span className="variables-label">Current value</span>
              <code>
                <LiveValue moduleId={moduleId} scope={selectedRow.scope} name={selectedRow.name} />
              </code>
            </div>
            <RuntimeVariableDetail
              row={selectedRow}
              onAddInitialValue={() =>
                open({ mode: 'create', scope: selectedRow.scope, runtimeKey: selectedRow.key }, moduleId)
              }
            />
          </>
        ) : null}
      </div>
      {pendingDelete && !readOnly && (
        <VariableReferencesDialog
          open
          mode="delete"
          scope={pendingDelete.row.scope}
          name={pendingDelete.row.name}
          references={pendingDelete.references}
          moduleId={moduleId}
          darkMode={darkMode}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteRow(pendingDelete.row)}
        />
      )}
    </div>
  );
};

export default VariableConfigurationPanel;
