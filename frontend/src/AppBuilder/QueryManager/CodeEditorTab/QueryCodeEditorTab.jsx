import React, { useEffect, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { CODE_EDITOR_TAB_KINDS } from './codeEditorTabWindows';
import './queryCodeEditorTab.scss';

// Typing is written to the query after this pause, and right away on blur, run or tab close.
const EDIT_COMMIT_DELAY_MS = 300;
const HEADER_HEIGHT_PX = 49;

const LANGUAGE_BY_KIND = { runjs: 'javascript', runpy: 'python' };
const KIND_LABEL = { runjs: 'JavaScript', runpy: 'Python' };

// The code editor of one RunJS/RunPython query, rendered into its own browser tab.
const QueryCodeEditorTab = ({ queryId, ownerDocument, flushRef }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const query = useStore((state) => state.dataQuery.queries.modules[moduleId]?.find(({ id }) => id === queryId));
  const shouldFreeze = useStore((state) => state.getShouldFreeze(false, isModuleEditor));
  const isSaving = useStore((state) => state.appStore.modules[moduleId]?.app?.isSaving ?? false);
  const isLoading = useStore(
    (state) => state.resolvedStore.modules[moduleId]?.exposedValues?.queries?.[queryId]?.isLoading ?? false
  );
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const pendingCode = useRef(null);
  const commitTimer = useRef(null);

  const queryName = query?.name;
  useEffect(() => {
    ownerDocument.title = queryName ? `${queryName} · Code editor` : 'Code editor';
  }, [ownerDocument, queryName]);

  const commit = () => {
    clearTimeout(commitTimer.current);
    if (pendingCode.current === null) return;
    const code = pendingCode.current;
    pendingCode.current = null;

    const { dataQuery, queryPanel } = useStore.getState();
    const current = dataQuery.queries.modules[moduleId]?.find(({ id }) => id === queryId);
    if (!current || current.options?.code === code) return;
    dataQuery.updateDataQueryById(queryId, { ...current.options, code }, moduleId);
    // The query panel autosaves the selected query; any other query is saved here.
    if (queryPanel.selectedQuery?.id !== queryId) {
      const updated = useStore.getState().dataQuery.queries.modules[moduleId].find(({ id }) => id === queryId);
      dataQuery.saveData(updated);
    }
  };

  const scheduleCommit = (code) => {
    pendingCode.current = code;
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(commit, EDIT_COMMIT_DELAY_MS);
  };

  flushRef.current = () => {
    commit();
    useStore.getState().dataQuery.saveData.flush?.();
  };

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  if (!query || !CODE_EDITOR_TAB_KINDS.includes(query.kind)) {
    return (
      <div className="query-code-editor-tab" data-cy="query-code-editor-tab">
        <div className="query-code-editor-tab__empty" data-cy="query-code-editor-tab-unavailable">
          This query isn&apos;t in the version open in the app any more. Open it again from the app.
        </div>
      </div>
    );
  }

  const onRun = () => {
    commit();
    runQuery(query.id, query.name, undefined, 'edit', {}, true, undefined, true);
  };

  return (
    <div className="query-code-editor-tab" data-cy="query-code-editor-tab">
      <header className="query-code-editor-tab__header" style={{ height: HEADER_HEIGHT_PX }}>
        <div className="query-code-editor-tab__title">
          <span className="tw-font-title-default tw-text-default" data-cy="query-code-editor-tab-name">
            {query.name}
          </span>
          <span className="tw-font-body-small tw-text-placeholder">{KIND_LABEL[query.kind]}</span>
          {shouldFreeze && (
            <span className="query-code-editor-tab__badge tw-font-body-small" data-cy="query-code-editor-tab-read-only">
              Read only
            </span>
          )}
        </div>
        <div className="query-code-editor-tab__actions">
          {!shouldFreeze && (
            <span className="tw-font-body-small tw-text-placeholder">{isSaving ? 'Saving…' : 'Saved in app'}</span>
          )}
          <ButtonComponent
            isLucid
            size="medium"
            variant="secondary"
            leadingIcon="play"
            onClick={onRun}
            disabled={query.status === 'draft' || isLoading}
            isLoading={isLoading}
            data-cy="query-code-editor-tab-run"
          >
            Run
          </ButtonComponent>
        </div>
      </header>
      <div className="query-code-editor-tab__editor">
        <CodeHinter
          type="multiline"
          initialValue={query.options?.code ?? ''}
          lang={LANGUAGE_BY_KIND[query.kind]}
          height={`calc(100vh - ${HEADER_HEIGHT_PX}px)`}
          className="query-hinter"
          onInputChange={scheduleCommit}
          onChange={(code) => {
            pendingCode.current = code;
            commit();
          }}
          readOnly={shouldFreeze}
          editable={!shouldFreeze}
          componentName={`QueryCodeEditorTab-${query.id}`}
          cyLabel="query-code-editor-tab"
          delayOnChange={false}
        />
      </div>
    </div>
  );
};

export default QueryCodeEditorTab;
