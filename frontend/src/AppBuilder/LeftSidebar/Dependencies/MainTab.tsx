import React from 'react';
import DependencySection from './DependencySection';
import DependencySubSection from './DependencySubSection';
import DependencyEntityRow from './DependencyEntityRow';
import { NoDependenciesEmptyState, NoSearchMatchesEmptyState } from './EmptyState';
import { ComponentIcon, EntityIcon, QueryIcon } from './entityIcons';
import { getComponentDisplayName } from './relationshipLabels';
import type { DependencySections } from '@/AppBuilder/_utils/entityUsage';
import type { ComponentsById, DependencySelection, QueriesById } from './types';

const matches = (name: string, term: string) => !term || String(name).toLowerCase().includes(term);

export type MainTabProps = {
  sections: DependencySections;
  searchTerm: string;
  queriesById: QueriesById;
  componentsById: ComponentsById;
  onSelect: (selection: DependencySelection) => void;
  onClearSearch: () => void;
};

/**
 * The Dependencies list: every entity on the page that participates in at least
 * one relationship, grouped by kind. Clicking a row opens its detail tab.
 */
export const MainTab = ({
  sections,
  searchTerm,
  queriesById,
  componentsById,
  onSelect,
  onClearSearch,
}: MainTabProps) => {
  const term = searchTerm.trim().toLowerCase();
  const searching = Boolean(term);

  const loadGroups = [
    { title: 'On app load', entries: sections.runsOnLoad.appLoad },
    { title: 'On page load', entries: sections.runsOnLoad.pageLoad },
    { title: 'Other page-load actions', entries: sections.runsOnLoad.pageLoadActions },
  ].map((group) => ({ ...group, entries: group.entries.filter((entry) => matches(entry.name, term)) }));
  const loadCount = loadGroups.reduce((sum, group) => sum + group.entries.length, 0);

  const variableGroups = [
    { title: 'App', scope: 'app', entries: sections.variables.app },
    { title: 'Page', scope: 'page', entries: sections.variables.page },
  ].map((group) => ({ ...group, entries: group.entries.filter((entry) => matches(entry.name, term)) }));
  const variableCount = variableGroups.reduce((sum, group) => sum + group.entries.length, 0);

  const queries = sections.queries.filter((entry) => matches(entry.name, term));
  const components = sections.components.filter((entry) => matches(entry.name, term));

  const visibleCount = loadCount + variableCount + queries.length + components.length;
  const hasAnyDependency =
    sections.runsOnLoad.appLoad.length +
      sections.runsOnLoad.pageLoad.length +
      sections.runsOnLoad.pageLoadActions.length +
      sections.variables.app.length +
      sections.variables.page.length +
      sections.queries.length +
      sections.components.length >
    0;

  if (!hasAnyDependency) return <NoDependenciesEmptyState />;
  if (visibleCount === 0) return <NoSearchMatchesEmptyState term={searchTerm.trim()} onClearSearch={onClearSearch} />;

  return (
    <>
      <DependencySection title="Runs on load" count={loadCount} forceExpanded={searching}>
        {loadGroups.map((group) => (
          <DependencySubSection key={group.title} title={group.title} count={group.entries.length}>
            {group.entries.map((entry) => (
              <DependencyEntityRow
                key={`${entry.kind}-${entry.id ?? entry.name}`}
                icon={
                  <EntityIcon
                    kind={entry.kind}
                    entityId={entry.id}
                    queriesById={queriesById}
                    componentsById={componentsById}
                  />
                }
                name={entry.name}
                highlight={term}
                onClick={
                  entry.kind === 'query' && entry.id
                    ? () => onSelect({ kind: 'query', id: entry.id as string })
                    : undefined
                }
                dataCy={`dependency-row-${entry.kind}-${String(entry.name).toLowerCase()}`}
              />
            ))}
          </DependencySubSection>
        ))}
      </DependencySection>

      <DependencySection title="Variables" count={variableCount} forceExpanded={searching}>
        {variableGroups.map((group) => (
          <DependencySubSection key={group.title} title={group.title} count={group.entries.length}>
            {group.entries.map((variable) => (
              <DependencyEntityRow
                key={`${variable.scope}-${variable.name}`}
                icon={<EntityIcon kind="variable" />}
                name={variable.name}
                highlight={term}
                onClick={() => onSelect({ kind: 'variable', id: `${variable.scope}:${variable.name}` })}
                dataCy={`dependency-row-variable-${variable.name.toLowerCase()}`}
              />
            ))}
          </DependencySubSection>
        ))}
      </DependencySection>

      <DependencySection title="Queries" count={queries.length} forceExpanded={searching}>
        {queries.map((entry) => (
          <DependencyEntityRow
            key={entry.id}
            icon={<QueryIcon query={entry.query} />}
            name={entry.name}
            highlight={term}
            onClick={() => onSelect({ kind: 'query', id: entry.id })}
            dataCy={`dependency-row-query-${entry.name.toLowerCase()}`}
          />
        ))}
      </DependencySection>

      <DependencySection title="Components" count={components.length} forceExpanded={searching}>
        {components.map((entry) => (
          <DependencyEntityRow
            key={entry.id}
            icon={<ComponentIcon componentType={entry.componentType} />}
            name={entry.name}
            subtitle={getComponentDisplayName(entry.componentType)}
            highlight={term}
            onClick={() => onSelect({ kind: 'component', id: entry.id })}
            dataCy={`dependency-row-component-${entry.name.toLowerCase()}`}
          />
        ))}
      </DependencySection>
    </>
  );
};

export default MainTab;
