import React from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import ActionDialog from '@/components/ui/Dialog';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { pageConfig } from '@/AppBuilder/RightSideBar/PageSettingsTab/pageConfig';
import { ActionTypes } from '@/AppBuilder/RightSideBar/Inspector/ActionTypes';
import DependencyEntityRow from '../Dependencies/DependencyEntityRow';
import { toPlainDefs, type PlainDefs } from '../CodeSearch/buildSearchRecords';
import { EntityIcon as RecordIcon } from '../CodeSearch/ResultRow';
import { navigateToResult } from '../CodeSearch/navigateToResult';
import { findVariableReferences, type VariableReference } from './variableReferences';
import type { VariableScope } from './variableRows';

const EMPTY: never[] = [];
let plainDefs: PlainDefs | null = null;
const getPlainDefs = () =>
  (plainDefs ||= toPlainDefs({
    widgetDefs: componentTypeDefinitionMap,
    actionDefs: ActionTypes,
    pageSettingsDef: pageConfig,
  }));

const GROUPS: Array<{ title: string; types: VariableReference['entityType'][] }> = [
  { title: 'Components', types: ['component'] },
  { title: 'Queries', types: ['query'] },
  { title: 'Events', types: ['event'] },
  { title: 'Pages & app', types: ['page', 'app'] },
];

/** Every confirmed and possible reference to a variable across all pages, from the current saved app. */
export function computeVariableReferences(moduleId: string, scope: VariableScope, name: string) {
  const state: any = useStore.getState();
  return findVariableReferences(
    {
      pages: state.modules[moduleId]?.pages || EMPTY,
      queries: state.dataQuery.queries.modules[moduleId] || EMPTY,
      events: state.eventsSlice.module[moduleId]?.events || EMPTY,
      globalSettings: state.globalSettings,
      pageSettings: state.pageSettings,
      queryIdNameMapping: state.modules[moduleId]?.queryIdNameMapping,
      defs: getPlainDefs(),
    },
    { scope, name, currentPageId: state.modules[moduleId]?.currentPageId }
  );
}

type Props = {
  open: boolean;
  mode: 'delete' | 'rename';
  scope: VariableScope;
  name: string;
  newName?: string;
  references: VariableReference[];
  moduleId: string;
  darkMode?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Blanket warning before a rename or delete. References are not rewritten: the list shows every
 * place to update, with "Possible" on the ones the name only appears in.
 */
const VariableReferencesDialog = ({
  open,
  mode,
  scope,
  name,
  newName,
  references,
  moduleId,
  darkMode = false,
  onCancel,
  onConfirm,
}: Props) => {
  const pageNames = useStore(
    (state: any) =>
      Object.fromEntries((state.modules[moduleId]?.pages ?? []).map((p: any) => [p.id, p.name])) as Record<
        string,
        string
      >,
    shallow
  );
  const count = references.length;
  const places = `${count} place${count === 1 ? '' : 's'}`;
  const title = mode === 'delete' ? `Delete ${name}?` : `Rename ${name} to ${newName}?`;

  return (
    <ActionDialog
      open={open}
      handleOpenChange={(next) => !next && onCancel()}
      title={title}
      cancelBtnProps={{ onClick: onCancel, 'data-cy': 'variable-references-cancel' } as any}
      submitActions={[
        {
          label: mode === 'delete' ? 'Delete variable' : 'Rename anyway',
          variant: mode === 'delete' ? 'dangerPrimary' : 'primary',
          onClick: onConfirm,
          'data-cy': 'variable-references-confirm',
        } as any,
      ]}
      classes={{ dialogContent: 'variables-references-dialog' }}
      data-cy="variable-references-dialog"
    >
      <div className="variables-references-body">
        <p>
          References aren’t updated automatically. The {places} below, and any that build the name dynamically, will
          read <code>undefined</code> until you update them.
        </p>
        <div className="variables-references-list" data-cy="variable-references-list">
          {GROUPS.map((group) => {
            const items = references.filter((r) => group.types.includes(r.entityType));
            if (!items.length) return null;
            return (
              <div key={group.title} className="variables-references-group">
                <div className="variables-references-group-title">
                  {group.title} ({items.length})
                </div>
                {items.map((ref, index) => (
                  <DependencyEntityRow
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${ref.record.entityId}-${ref.record.fieldPath.join('.')}-${index}`}
                    icon={
                      <RecordIcon
                        entity={
                          {
                            entityType: ref.entityType,
                            componentType: ref.componentType,
                            query: ref.record.query,
                          } as any
                        }
                        darkMode={darkMode}
                      />
                    }
                    name={ref.entityName}
                    subtitle={[ref.fieldLabel, ref.pageId ? pageNames[ref.pageId] : null].filter(Boolean).join(' · ')}
                    tags={[ref.preview]}
                    trailing={
                      ref.confidence === 'possible' ? (
                        <span
                          className="variables-badge-possible"
                          title="The name appears here, but not as a direct reference to this variable"
                        >
                          Possible
                        </span>
                      ) : undefined
                    }
                    onClick={() => {
                      onCancel();
                      navigateToResult({ record: ref.record, start: ref.start, end: ref.end, occurrence: 0 }, moduleId);
                    }}
                    dataCy={`variable-reference-${ref.entityName}`}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <span className="variables-hint">
          {scope === 'app' ? 'App variable' : 'Page variable'} references are searched across every page.
        </span>
      </div>
    </ActionDialog>
  );
};

export default VariableReferencesDialog;
