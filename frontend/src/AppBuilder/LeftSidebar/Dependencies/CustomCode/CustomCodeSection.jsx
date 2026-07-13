import React, { useMemo, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { ChevronRightIcon } from 'lucide-react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { getCustomCodeInventory, getVariableUsage } from '@/AppBuilder/_utils/entityUsage';
import EntityUsageList from '@/AppBuilder/Shared/EntityUsage/EntityUsageList';
import useEntityNavigation, { KIND_LABELS } from '@/AppBuilder/Shared/EntityUsage/useEntityNavigation';

const truncate = (str, max) => (str.length > max ? `${str.slice(0, max)}…` : str);

const errorPreview = (err) => {
  if (!err) return '';
  if (typeof err === 'string') return truncate(err, 300);
  const msg = err.message ?? err.description ?? err.data?.message;
  try {
    return truncate(String(msg ?? JSON.stringify(err)), 300);
  } catch (e) {
    return truncate(String(msg ?? err), 300);
  }
};

const valuePreview = (value) => {
  if (value === undefined) return '—';
  try {
    const str = typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
    return truncate(str ?? String(value), 40);
  } catch (e) {
    return truncate(String(value), 40);
  }
};

// Selector returns a string → primitive-stable, safe against resolved-store churn.
const useQueryRuntimeError = (moduleId, queryId) =>
  useStore((state) => errorPreview(state.resolvedStore.modules[moduleId]?.exposedValues?.queries?.[queryId]?.error));

// Hover detail for the refs-summary line: the names behind each count.
const SummaryPopoverContent = ({ analysis }) => {
  const groups = [
    {
      title: 'Writes',
      entries: [
        ...analysis.variableWrites.map((name) => ({ kind: 'variable', name })),
        ...analysis.pageVariableWrites.map((name) => ({ kind: 'pageVariable', name })),
      ],
    },
    {
      title: 'Reads',
      entries: [
        ...analysis.variableReads.map((name) => ({ kind: 'variable', name })),
        ...analysis.pageVariableReads.map((name) => ({ kind: 'pageVariable', name })),
      ],
    },
    { title: 'Components', entries: analysis.componentRefs.map((name) => ({ kind: 'component', name })) },
    { title: 'Queries', entries: analysis.queryRefs.map((name) => ({ kind: 'query', name })) },
  ].filter((group) => group.entries.length > 0);

  return (
    <div className="custom-code-summary-popover-content">
      {groups.map((group) => (
        <div className="entity-usage-group" key={group.title}>
          <div className="entity-usage-group-title">
            {group.title} · {group.entries.length}
          </div>
          {group.entries.map((entry) => (
            <div className="entity-usage-row" key={`${entry.kind}-${entry.name}`}>
              <div className="entity-usage-row-main">
                <span className={`entity-usage-kind entity-usage-kind-${entry.kind}`}>{KIND_LABELS[entry.kind]}</span>
                <span className="entity-usage-name text-truncate">{entry.name}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ScriptRow = ({ moduleId, queryId, name, tag, analysis, onNavigate, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const runtimeError = useQueryRuntimeError(moduleId, queryId);
  const syntaxError = analysis?.syntaxError;
  const hasError = Boolean(runtimeError) || Boolean(syntaxError);

  const summary = analysis
    ? [
        analysis.componentRefs.length && `uses ${analysis.componentRefs.length} component(s)`,
        analysis.queryRefs.length &&
          `uses ${analysis.queryRefs.length} quer${analysis.queryRefs.length === 1 ? 'y' : 'ies'}`,
        (analysis.variableWrites.length || analysis.pageVariableWrites.length) &&
          `writes ${analysis.variableWrites.length + analysis.pageVariableWrites.length} variable(s)`,
        (analysis.variableReads.length || analysis.pageVariableReads.length) &&
          `reads ${analysis.variableReads.length + analysis.pageVariableReads.length} variable(s)`,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <div className="custom-code-row">
      <div
        className="dependency-viewer-row-header"
        onClick={onNavigate}
        role="button"
        data-cy={`custom-code-script-${name.toLowerCase()}`}
      >
        <span
          className="dependency-viewer-chevron-wrapper"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          role="button"
        >
          <ChevronRightIcon size={14} className={`dependency-viewer-chevron ${expanded ? 'expanded' : ''}`} />
        </span>
        <span className="dependency-viewer-component-name text-truncate">{name}</span>
        <span className="custom-code-tag">{tag}</span>
        {hasError && <span className="custom-code-error-dot" title="This script has an error" />}
      </div>
      {expanded && (
        <div className="dependency-viewer-row-body custom-code-detail">
          {summary && (
            <OverlayTrigger
              placement="right"
              trigger={['hover', 'focus']}
              delay={{ show: 200, hide: 100 }}
              overlay={
                <Popover
                  id={`custom-code-summary-popover-${queryId}`}
                  className={`query-usage-hover-popover ${darkMode ? 'dark-theme' : ''}`}
                >
                  <Popover.Body>
                    <SummaryPopoverContent analysis={analysis} />
                  </Popover.Body>
                </Popover>
              }
            >
              <div className="custom-code-summary custom-code-summary-hover">{summary}</div>
            </OverlayTrigger>
          )}
          {syntaxError && (
            <div className="custom-code-error">
              Syntax error: {syntaxError.message} @ {syntaxError.line}:{syntaxError.column}
            </div>
          )}
          {runtimeError && <div className="custom-code-error">Last run failed: {runtimeError}</div>}
          {!summary && !syntaxError && !runtimeError && (
            <div className="custom-code-summary">
              {tag === 'py' ? 'Python code is not analyzed — runtime errors only.' : 'No entity references detected.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FxComponentRow = ({ item, onNavigate, darkMode }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="custom-code-row">
      <div
        className="dependency-viewer-row-header"
        onClick={onNavigate}
        role="button"
        data-cy={`custom-code-fx-${item.name.toLowerCase()}`}
      >
        <span
          className="dependency-viewer-chevron-wrapper"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          role="button"
        >
          <ChevronRightIcon size={14} className={`dependency-viewer-chevron ${expanded ? 'expanded' : ''}`} />
        </span>
        <span className="dependency-viewer-component-name text-truncate">{item.name}</span>
        <span className="dependency-viewer-count">{item.entries.length} fx</span>
      </div>
      {expanded && (
        <div className="dependency-viewer-row-body custom-code-detail">
          {item.entries.map((entry) => (
            <OverlayTrigger
              key={`${entry.section}-${entry.prop}`}
              placement="right"
              trigger={['hover', 'focus']}
              delay={{ show: 200, hide: 100 }}
              overlay={
                <Popover
                  id={`custom-code-fx-popover-${item.componentId}-${entry.section}-${entry.prop}`}
                  className={`query-usage-hover-popover ${darkMode ? 'dark-theme' : ''}`}
                >
                  <Popover.Body>
                    <div className="custom-code-fx-popover-content">
                      <div className="entity-usage-group-title">
                        {entry.section}.{entry.prop}
                      </div>
                      <div className="custom-code-fx-popover-expression">{entry.expression}</div>
                    </div>
                  </Popover.Body>
                </Popover>
              }
            >
              <div className="custom-code-fx-entry">
                <span className="custom-code-fx-prop">
                  {entry.section}.{entry.prop}
                </span>
                <span className="custom-code-fx-expression text-truncate">{truncate(entry.expression, 60)}</span>
              </div>
            </OverlayTrigger>
          ))}
        </div>
      )}
    </div>
  );
};

const VariableRow = ({ moduleId, variable }) => {
  const [expanded, setExpanded] = useState(false);
  const value = useStore((state) => {
    const exposed = state.resolvedStore.modules[moduleId]?.exposedValues;
    const raw =
      variable.scope === 'app' ? exposed?.variables?.[variable.name] : exposed?.page?.variables?.[variable.name];
    return valuePreview(raw);
  });

  return (
    <div className="custom-code-row">
      <div
        className="dependency-viewer-row-header"
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        data-cy={`custom-code-variable-${variable.name.toLowerCase()}`}
      >
        <span className="dependency-viewer-chevron-wrapper">
          <ChevronRightIcon size={14} className={`dependency-viewer-chevron ${expanded ? 'expanded' : ''}`} />
        </span>
        <span className="dependency-viewer-component-name text-truncate">{variable.name}</span>
        <span className="custom-code-tag">{variable.scope === 'app' ? 'variable' : 'page var'}</span>
        <span className="custom-code-value text-truncate" title={value}>
          {value}
        </span>
      </div>
      {expanded && (
        <div className="dependency-viewer-row-body">
          <EntityUsageList
            groups={[
              { title: 'Set by', entries: variable.setBy },
              { title: 'Read by', entries: variable.readBy },
            ]}
            emptyMessage="No writers or readers detected."
          />
        </div>
      )}
    </div>
  );
};

const SubsectionTitle = ({ children }) => <div className="custom-code-subsection-title">{children}</div>;

// "Custom code" section: scripts (RunJS/RunPy + transformations), fx-mode
// component properties, and a variable-centric writers/readers list with live
// values. Lives in the Dependencies panel; recomputes with the same store
// identities the component list uses.
const CustomCodeSection = ({ moduleId, darkMode }) => {
  const [sectionExpanded, setSectionExpanded] = useState(false);
  const navigateToEntity = useEntityNavigation();

  const pageComponents = useStore((state) => state.getCurrentPageComponents(moduleId), shallow);
  const queries = useStore((state) => state.dataQuery.queries.modules[moduleId]);
  const events = useStore((state) => state.eventsSlice.module[moduleId]?.events);

  const { inventory, variableUsage } = useMemo(() => {
    const state = useStore.getState();
    return {
      inventory: getCustomCodeInventory(state, moduleId),
      variableUsage: getVariableUsage(state, moduleId),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageComponents, queries, events, moduleId]);

  const { scripts, transformations, fxByComponent } = inventory;
  const { variables, dynamicAccessors } = variableUsage;
  const totalCount = scripts.length + transformations.length + fxByComponent.length + variables.length;
  if (totalCount === 0) return null;

  return (
    <div className="dependency-viewer-row dependency-viewer-custom-code">
      <div
        className="dependency-viewer-row-header"
        onClick={() => setSectionExpanded((prev) => !prev)}
        role="button"
        data-cy="custom-code-section-header"
      >
        <span className="dependency-viewer-chevron-wrapper">
          <ChevronRightIcon size={14} className={`dependency-viewer-chevron ${sectionExpanded ? 'expanded' : ''}`} />
        </span>
        <span className="dependency-viewer-component-name text-truncate">Custom code</span>
        <span className="dependency-viewer-count">{totalCount}</span>
      </div>
      {sectionExpanded && (
        <div className="dependency-viewer-row-body custom-code-body">
          {(scripts.length > 0 || transformations.length > 0) && (
            <>
              <SubsectionTitle>Scripts</SubsectionTitle>
              {scripts.map((script) => (
                <ScriptRow
                  darkMode={darkMode}
                  key={script.id}
                  moduleId={moduleId}
                  queryId={script.id}
                  name={script.name}
                  tag={script.kind === 'runjs' ? 'js' : 'py'}
                  analysis={script.analysis}
                  onNavigate={() => navigateToEntity({ kind: 'query', id: script.id, name: script.name })}
                />
              ))}
              {transformations.map((tr) => (
                <ScriptRow
                  darkMode={darkMode}
                  key={`transformation-${tr.queryId}`}
                  moduleId={moduleId}
                  queryId={tr.queryId}
                  name={`${tr.name} · transformation`}
                  tag={tr.language === 'python' ? 'py' : 'js'}
                  analysis={tr.analysis}
                  onNavigate={() => navigateToEntity({ kind: 'query', id: tr.queryId, name: tr.name })}
                />
              ))}
            </>
          )}
          {fxByComponent.length > 0 && (
            <>
              <SubsectionTitle>fx properties</SubsectionTitle>
              {fxByComponent.map((item) => (
                <FxComponentRow
                  key={item.componentId}
                  item={item}
                  darkMode={darkMode}
                  onNavigate={() => navigateToEntity({ kind: 'component', id: item.componentId, name: item.name })}
                />
              ))}
            </>
          )}
          {variables.length > 0 && (
            <>
              <SubsectionTitle>Variables</SubsectionTitle>
              {variables.map((variable) => (
                <VariableRow key={`${variable.scope}:${variable.name}`} moduleId={moduleId} variable={variable} />
              ))}
            </>
          )}
          {dynamicAccessors.length > 0 && (
            <div className="custom-code-dynamic">
              <SubsectionTitle>Dynamic variable access</SubsectionTitle>
              <EntityUsageList
                groups={[{ title: 'Scripts with non-literal variable keys', entries: dynamicAccessors }]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomCodeSection;
