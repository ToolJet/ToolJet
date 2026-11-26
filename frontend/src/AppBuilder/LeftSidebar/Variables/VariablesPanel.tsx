import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { copyToClipboard } from '@/_helpers/appUtils';
import { Button as RawButton } from '@/components/ui/Button/Button';
import RawInputComponent from '@/components/ui/Input/Index';
import RawPanelHeader from '@/AppBuilder/Shared/Panel/PanelHeader';
import { getPanelCloseLabel, getQueryAddButtonPresentation } from '@/AppBuilder/panelLayout';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import DependencySection from '../Dependencies/DependencySection';
import DependencyEntityRow from '../Dependencies/DependencyEntityRow';
import { EntityIcon } from '../Dependencies/entityIcons';
import { ToolTip } from '@/_components/ToolTip';
import { DefaultCopyIcon } from '../LeftSidebarInspector/DefaultCopyIcon';
import { previewOf, referenceOf, typeLabelOf } from './variableRows';
import type { VariableScope } from './variableRows';
import { useVariablePanelData } from './useVariablePanelData';
import '../Dependencies/styles.scss';
import '../panelHeader.scss';
import './styles.scss';

const ButtonComponent = RawButton as React.ComponentType<any>;
const InputComponent = RawInputComponent as React.ComponentType<any>;
const PanelHeader = RawPanelHeader as React.ComponentType<any>;
export type VariablesPanelProps = { darkMode?: boolean; onClose: () => void; moduleId: string };
const variableIcon = <EntityIcon kind="variable" size={16} />;

/** Searchable left resource list. Configuration has an independent owner in the right panel. */
const VariablesPanel = ({ darkMode, onClose, moduleId }: VariablesPanelProps) => {
  const [search, setSearch] = useState('');
  const addButtonPresentation = getQueryAddButtonPresentation('left');
  const readOnly = useStore((state: any) => state.getShouldFreeze());
  const openVariablePanel = useStore((state: any) => state.openVariablePanel);
  const selection = useStore((state: any) => state.variablePanelContext);
  const isConfigurationOpen = useStore(
    (state: any) => state.isRightSidebarOpen && state.activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.VARIABLES
  );
  const { rows, liveApp, livePage, pageName, pageId, isModule } = useVariablePanelData(moduleId);
  const term = search.trim().toLowerCase();
  const renderGroup = (scope: VariableScope) => {
    if (isModule && scope === 'page') return null;
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
            onClick={() => openVariablePanel({ mode: 'create', scope }, moduleId)}
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
                selected={
                  isConfigurationOpen &&
                  selection?.moduleId === moduleId &&
                  selection?.scope === scope &&
                  selection?.name === row.name &&
                  (scope === 'app' || selection?.pageId === pageId)
                }
                onClick={() => openVariablePanel({ scope: row.scope, name: row.name }, moduleId)}
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
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => openVariablePanel({ mode: 'create', scope }, moduleId)}
                >
                  Create one
                </button>
              </>
            )}
          </div>
        )}
      </DependencySection>
    );
  };

  return (
    <div className={`left-sidebar-variables ${darkMode ? 'dark-theme' : ''}`} data-cy="variables-panel">
      <div className={`inspector-header ${darkMode ? 'dark-theme' : ''}`}>
        <PanelHeader
          title="Variables"
          titleDataCy="variables-panel-title"
          closeDataCy="variables-panel-close"
          closeLabel={getPanelCloseLabel('variables')}
          onClose={onClose}
          divider={false}
        >
          <ButtonComponent
            aria-label="New variable"
            leadingIcon="plus"
            isLucid
            size={addButtonPresentation.size}
            variant={addButtonPresentation.variant}
            style={addButtonPresentation.style}
            onClick={() => openVariablePanel({ mode: 'create', scope: 'app' }, moduleId)}
            disabled={readOnly}
            data-cy="variables-new-button"
          >
            New variable
          </ButtonComponent>
        </PanelHeader>
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
      </div>
      <div className="variables-body">
        {renderGroup('app')}
        {renderGroup('page')}
      </div>
    </div>
  );
};

export default VariablesPanel;
