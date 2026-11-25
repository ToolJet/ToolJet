import React, { useEffect, useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { CopyIcon, Trash2Icon, WaypointsIcon } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { normalizeVariableDefinitionMap } from '@/AppBuilder/_utils/variableDefinitions';
import { copyToClipboard } from '@/_helpers/appUtils';
import { Button as RawButton } from '@/components/ui/Button/Button';
import RawInputComponent from '@/components/ui/Input/Index';
import DependencySection from '../Dependencies/DependencySection';
import DependencyEntityRow from '../Dependencies/DependencyEntityRow';
import { DetailHeader } from '../Dependencies/DetailTab';
import { EntityIcon } from '../Dependencies/entityIcons';
import { CreateVariableForm, EditVariableForm, RuntimeVariableDetail } from './VariableEditor';
import VariableReferencesDialog, { computeVariableReferences } from './VariableReferencesDialog';
import type { VariableReference } from './variableReferences';
import toast from 'react-hot-toast';
import { ToolTip } from '@/_components/ToolTip';
import { DefaultCopyIcon } from '../LeftSidebarInspector/DefaultCopyIcon';
import { buildVariableRows, previewOf, referenceOf, rowKey, typeLabelOf } from './variableRows';
import type { VariableRow, VariableScope } from './variableRows';
import '../Dependencies/styles.scss';
import './styles.scss';

const ButtonComponent = RawButton as React.ComponentType<any>;
const InputComponent = RawInputComponent as React.ComponentType<any>;

type View =
  | { name: 'list' }
  | { name: 'new'; scope: VariableScope; runtimeKey?: string }
  | { name: 'detail'; scope: VariableScope; variableName: string };

export type VariablesPanelProps = {
  darkMode?: boolean;
  onClose: () => void;
  moduleId: string;
};

const variableIcon = <EntityIcon kind="variable" size={16} />;

const LiveValue = ({ moduleId, scope, name }: { moduleId: string; scope: VariableScope; name: string }) => {
  const preview = useStore((state: any) => {
    const exposed = state.resolvedStore.modules[moduleId]?.exposedValues;
    return previewOf(scope === 'app' ? exposed?.variables?.[name] : exposed?.page?.variables?.[name], 60);
  });
  return <>{preview}</>;
};

/** Left sidebar "Variables" panel: create, initialise, edit and delete app and page variables. */
const VariablesPanel = ({ darkMode, onClose, moduleId }: VariablesPanelProps) => {
  const readOnly = useStore((state: any) => state.getShouldFreeze());
  const [view, setView] = useState<View>({ name: 'list' });
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ row: VariableRow; references: VariableReference[] } | null>(
    null
  );
  const deleteVariableDefinition = useStore((state: any) => state.deleteVariableDefinition);

  const deleteRow = async (row: VariableRow) => {
    if (readOnly) return;
    const result = await deleteVariableDefinition(row.definition!.id, moduleId);
    if (!result.ok) return;
    toast.success(`Deleted ${row.name}`);
    setPendingDelete(null);
    setView({ name: 'list' });
  };

  const requestDelete = (row: VariableRow) => {
    if (readOnly) return;
    const references = computeVariableReferences(moduleId, row.scope, row.name);
    if (!references.length) deleteRow(row);
    else setPendingDelete({ row, references });
  };

  const rawAppMap = useStore((state: any) => state.globalSettings?.variables);
  const { rawPageMap, pageName } = useStore((state: any) => {
    const pageId = state.getCurrentPageId(moduleId);
    const page = state.modules[moduleId]?.pages?.find((p: any) => p.id === pageId);
    return { rawPageMap: page?.variables, pageName: page?.name ?? 'this page' };
  }, shallow);
  const appMap = useMemo(() => normalizeVariableDefinitionMap(rawAppMap), [rawAppMap]);
  const pageMap = useMemo(() => normalizeVariableDefinitionMap(rawPageMap), [rawPageMap]);
  // Recompute runtime-only rows when scripts, events or live values can have changed.
  const queries = useStore((state: any) => state.dataQuery.queries.modules[moduleId]);
  const events = useStore((state: any) => state.eventsSlice.module[moduleId]?.events);
  const liveApp = useStore((state: any) => state.resolvedStore.modules[moduleId]?.exposedValues?.variables);
  const livePage = useStore((state: any) => state.resolvedStore.modules[moduleId]?.exposedValues?.page?.variables);
  const liveAppKeys = Object.keys(liveApp ?? {}).join('|');
  const livePageKeys = Object.keys(livePage ?? {}).join('|');
  const setEntityToViewDependencies = useStore((state: any) => state.setEntityToViewDependencies);

  const rows = useMemo(
    () => buildVariableRows(useStore.getState(), moduleId, appMap ?? {}, pageMap ?? {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appMap, pageMap, queries, events, liveAppKeys, livePageKeys, moduleId]
  );

  const definitions = useMemo(
    () => [
      ...Object.values(appMap ?? {}).map((d: any) => ({ ...d, scope: 'app' as const })),
      ...Object.values(pageMap ?? {}).map((d: any) => ({ ...d, scope: 'page' as const })),
    ],
    [appMap, pageMap]
  );

  const findRow = (scope: VariableScope, name: string) =>
    rows[scope].find((r) => r.name === name && r.definition) ?? rows[scope].find((r) => r.name === name);

  const selectedRow = view.name === 'detail' ? findRow(view.scope, view.variableName) : undefined;
  const runtimeRow =
    view.name === 'new' && view.runtimeKey
      ? [...rows.app, ...rows.page].find((r) => r.key === view.runtimeKey)
      : undefined;

  // A detail view whose variable was deleted (here, by undo, or by a collaborator) falls back to the list.
  useEffect(() => {
    if (view.name === 'detail' && !selectedRow) setView({ name: 'list' });
  }, [view, selectedRow]);

  const openDetail = (row: VariableRow) => setView({ name: 'detail', scope: row.scope, variableName: row.name });
  const term = search.trim().toLowerCase();

  const renderGroup = (scope: VariableScope) => {
    const list = rows[scope].filter((r) => !term || r.name.toLowerCase().includes(term));
    const title = scope === 'app' ? 'App variables' : `Page variables · ${pageName}`;
    return (
      <DependencySection
        title={title}
        count={list.length}
        forceExpanded={Boolean(term)}
        showWhenEmpty
        dataCy={`variables-section-${scope}`}
        action={
          <ButtonComponent
            iconOnly
            leadingIcon="plus"
            variant="ghost"
            size="small"
            isLucid
            aria-label={`New ${scope} variable`}
            disabled={readOnly}
            onClick={() => setView({ name: 'new', scope })}
            data-cy={`variables-add-${scope}`}
          />
        }
      >
        {list.length ? (
          list.map((row) => {
            const liveValue = (scope === 'app' ? liveApp : livePage)?.[row.name];
            const type = typeLabelOf(liveValue);
            return (
              <DependencyEntityRow
                key={row.key}
                icon={variableIcon}
                name={row.name}
                tags={[previewOf(liveValue, 500)]}
                nameSuffix={
                  <span
                    className={`variables-type-label type-${type.kind}`}
                    data-cy={`variables-row-type-${scope}-${row.name}`}
                  >
                    {type.label}
                  </span>
                }
                highlight={term}
                onClick={() => openDetail(row)}
                dataCy={`variables-row-${scope}-${row.name}`}
                trailing={
                  <>
                    {!row.definition && (
                      <span
                        className="variables-badge-runtime"
                        title={`No initial value. Created at runtime${row.setBy ? ` by ${row.setBy}` : ''}`}
                      >
                        Runtime only
                      </span>
                    )}
                    <ToolTip message="Copy path">
                      <button
                        type="button"
                        className="variables-row-copy"
                        aria-label={`Copy path of ${row.name}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          // Drop focus so the icon hides again once the pointer leaves the row.
                          event.currentTarget.blur();
                          copyToClipboard(referenceOf(scope, row.name));
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        data-cy={`variables-row-copy-${scope}-${row.name}`}
                      >
                        <DefaultCopyIcon height={12} width={12} />
                      </button>
                    </ToolTip>
                  </>
                }
                darkMode={darkMode}
              />
            );
          })
        ) : (
          <div className="variables-empty" data-cy={`variables-empty-${scope}`}>
            {term ? (
              'No matches.'
            ) : (
              <>
                No {scope} variables yet.{' '}
                <button type="button" disabled={readOnly} onClick={() => setView({ name: 'new', scope })}>
                  Create one
                </button>
              </>
            )}
          </div>
        )}
      </DependencySection>
    );
  };

  const header = () => {
    if (view.name === 'new') {
      return (
        <DetailHeader
          subject={{
            kind: 'variable',
            name: runtimeRow ? runtimeRow.name : 'New variable',
            icon: variableIcon,
          }}
          breadcrumbRoot="Variables"
          menuItems={[]}
          darkMode={darkMode}
          onNavigateRoot={() => setView({ name: 'list' })}
        />
      );
    }
    if (view.name === 'detail' && selectedRow) {
      const reference = referenceOf(selectedRow.scope, selectedRow.name);
      return (
        <DetailHeader
          subject={{ kind: 'variable', name: selectedRow.name, icon: variableIcon }}
          breadcrumbRoot="Variables"
          darkMode={darkMode}
          onNavigateRoot={() => setView({ name: 'list' })}
          menuItems={[
            { label: 'Copy reference', icon: <CopyIcon size={16} />, onClick: () => copyToClipboard(reference) },
            {
              label: 'View in Dependencies',
              icon: <WaypointsIcon size={16} />,
              onClick: () =>
                setEntityToViewDependencies({ kind: 'variable', id: rowKey(selectedRow.scope, selectedRow.name) }),
            },
            ...(selectedRow.definition && !readOnly
              ? [
                  {
                    label: 'Delete variable',
                    icon: <Trash2Icon size={16} />,
                    onClick: () => requestDelete(selectedRow),
                  },
                ]
              : []),
          ]}
        />
      );
    }
    return (
      <div className="inspector-header-search">
        <InputComponent
          leadingIcon="search01"
          onChange={(e: any) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          size="medium"
          placeholder="Search variables"
          value={search}
          {...(search && { trailingAction: 'clear' })}
          data-cy="variables-search-input"
        />
      </div>
    );
  };

  const body = () => {
    if (view.name === 'new') {
      return (
        <CreateVariableForm
          key={view.runtimeKey ?? view.scope}
          moduleId={moduleId}
          pageName={pageName}
          definitions={definitions}
          initialScope={view.scope}
          runtimeVariable={runtimeRow}
          onCreated={(scope, name) => setView({ name: 'detail', scope, variableName: name })}
        />
      );
    }
    if (view.name === 'detail' && selectedRow) {
      return selectedRow.definition ? (
        <EditVariableForm
          moduleId={moduleId}
          pageName={pageName}
          definitions={definitions}
          row={selectedRow}
          onRenamed={(scope, name) => setView({ name: 'detail', scope, variableName: name })}
        />
      ) : (
        <>
          <div className="variables-detail-value">
            <span className="variables-label">Current value</span>
            <code>
              <LiveValue moduleId={moduleId} scope={selectedRow.scope} name={selectedRow.name} />
            </code>
          </div>
          <RuntimeVariableDetail
            row={selectedRow}
            onAddInitialValue={() => setView({ name: 'new', scope: selectedRow.scope, runtimeKey: selectedRow.key })}
          />
        </>
      );
    }
    return (
      <>
        {renderGroup('app')}
        {renderGroup('page')}
      </>
    );
  };

  return (
    <div className={`left-sidebar-variables ${darkMode ? 'dark-theme' : ''}`} data-cy="variables-panel">
      <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
        <div className="inspector-header-top">
          <span className="inspector-header-title" data-cy="variables-panel-title">
            Variables
          </span>
          <div className="variables-header-actions">
            {view.name === 'list' && (
              <ButtonComponent
                variant="outline"
                size="small"
                leadingIcon="plus"
                isLucid
                onClick={() => setView({ name: 'new', scope: 'app' })}
                disabled={readOnly}
                data-cy="variables-new-button"
              >
                New variable
              </ButtonComponent>
            )}
            <ButtonComponent
              iconOnly
              leadingIcon="x"
              onClick={onClose}
              variant="ghost"
              size="medium"
              isLucid
              data-cy="variables-panel-close"
            />
          </div>
        </div>
        {header()}
      </div>
      <div className="variables-body">{body()}</div>
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

export default VariablesPanel;
