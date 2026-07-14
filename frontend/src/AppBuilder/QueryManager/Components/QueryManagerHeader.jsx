import React, { useState, forwardRef, useRef, useEffect, useCallback } from 'react';
import RenameIcon from '../Icons/RenameIcon';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { ABORT_UNSUPPORTED_KINDS } from '@/AppBuilder/QueryManager/constants';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components';
import { Button } from 'react-bootstrap';
import { decodeEntities } from '@/_helpers/utils';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import useStore from '@/AppBuilder/_stores/store';
import { useContainerWidth } from '@/_hooks/useContainerWidth';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { debounce } from 'lodash';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { useAppDataStore } from '@/_stores/appDataStore';
import AITripleSparkles from '@/_ui/Icon/solidIcons/AITripleSparkles';
import { useIsAiBlockedOnDefaultBranch } from '@/_hooks/useIsAiBlockedOnDefaultBranch';

const ICON_ONLY_BUTTON_BREAKPOINT = 700;

const GENERATE_QUERY_SUPPORTED_KINDS = [
  'postgresql',
  'openapi',
  'gmail',
  'googlecalendar',
  'mongodb',
  'bigquery',
  'mysql',
  'mssql',
  'snowflake',
  'openai',
  'runjs',
  'databricks',
];

export const QueryManagerHeader = forwardRef(({ darkMode, setActiveTab, activeTab }, ref) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const updateQuerySuggestions = useStore((state) => state.queryPanel.updateQuerySuggestions);
  const previewQuery = useStore((state) => state.queryPanel.previewQuery);
  const renameQuery = useStore((state) => state.dataQuery.renameQuery);
  const checkExistingQueryName = useStore((state) => state.dataQuery.checkExistingQueryName);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const showCreateQuery = useStore((state) => state.queryPanel.showCreateQuery);
  const setShowCreateQuery = useStore((state) => state.queryPanel.setShowCreateQuery);
  const queryName = selectedQuery?.name ?? '';
  const shouldFreeze = useStore((state) => state.getShouldFreeze(false, isModuleEditor));

  const headerRef = useRef(null);
  const headerWidth = useContainerWidth(headerRef);

  useEffect(() => {
    if (selectedQuery?.name) {
      setShowCreateQuery(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuery?.name]);

  const isInDraft = selectedQuery?.status === 'draft';

  const executeQueryNameUpdation = (newName) => {
    const { name } = selectedQuery;
    if (name === newName || !newName) {
      return false;
    }

    const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
    if (isNewQueryNameAlreadyExists) {
      toast.error('Query name already exists');
      return false;
    }

    if (newName) {
      renameQuery(selectedQuery?.id, newName);
      updateQuerySuggestions(name, newName);
      return true;
    }
  };

  const buttonLoadingState = (loading, disabled = false) => {
    return cx(
      `${loading ? (darkMode ? 'btn-loading' : 'button-loading') : ''}`,
      { 'theme-dark ': darkMode },
      { disabled: disabled || !selectedDataSource }
    );
  };

  const { appId } = useAppDataStore(
    (state) => ({
      appId: state?.appId,
    }),
    shallow
  );

  const previewButtonOnClick = () => {
    const _options = { ...selectedQuery.options };
    posthogHelper.captureEvent('click_preview', { dataSource: selectedDataSource?.kind, appId });
    const query = {
      data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
      pluginId: selectedDataSource.pluginId,
      options: _options,
      kind: selectedDataSource.kind,
      name: queryName,
      id: selectedQuery?.id,
    };
    previewQuery(query, false, undefined, moduleId)
      .then(() => {
        ref.current.scrollIntoView();
      })
      .catch(({ error, data }) => {
        console.log(error, data);
      });
  };
  const tabs = [
    { id: 1, label: 'Setup' },
    {
      id: 2,
      label: 'Transformation',
      condition: !['runpy', 'runjs', 'workflows'].includes(selectedQuery?.kind),
    },
    { id: 3, label: 'Settings' },
  ];

  const iconOnly = headerWidth > 0 && headerWidth < ICON_ONLY_BUTTON_BREAKPOINT;

  return (
    <div className="row header" style={{ padding: '8px 16px' }} ref={headerRef}>
      <div className="col font-weight-500 p-0">
        {selectedQuery && (
          <NameInput
            onInput={executeQueryNameUpdation}
            selectedQuery={selectedQuery}
            value={queryName}
            darkMode={darkMode}
            isDiabled={shouldFreeze}
          />
        )}
        {selectedQuery && (
          <div className="d-flex" style={{ marginBottom: '-15px', gap: '3px' }}>
            {tabs.map(
              (tab) =>
                (tab.condition === undefined || tab.condition) && (
                  <p
                    key={tab.id}
                    data-cy={`query-tab-${tab.label.toLowerCase()}`}
                    className="m-0 d-flex align-items-center h-100"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      borderBottom: activeTab === tab.id ? '2px solid #3E63DD' : '',
                      cursor: 'pointer',
                      padding: '0px 8px 6px 8px',
                      color: activeTab === tab.id ? 'var(--text-default)' : 'var(--text-placeholder)',
                    }}
                  >
                    {tab.label}
                  </p>
                )
            )}
          </div>
        )}
      </div>
      <div className="query-header-buttons">
        {!(selectedQuery === null || showCreateQuery) && (
          <>
            <GenerateQueryButton iconOnly={iconOnly} />
            <AbortButton />
            <RunButton buttonLoadingState={buttonLoadingState} iconOnly={iconOnly} />
            <PreviewButton
              disabled={shouldFreeze}
              onClick={previewButtonOnClick}
              buttonLoadingState={buttonLoadingState}
            />
          </>
        )}
      </div>
    </div>
  );
});

const NameInput = ({ onInput, value, darkMode, isDiabled, selectedQuery }) => {
  const { isModuleEditor } = useModuleContext();
  const shouldFreeze = useStore((state) => state.getShouldFreeze(false, isModuleEditor));
  const isFocused = useStore((state) => state.queryPanel.nameInputFocused, shallow);
  const setIsFocused = useStore((state) => state.queryPanel.setNameInputFocused, shallow);
  const [name, setName] = useState(value);
  const selectedDataSourceScope = useStore((state) => state.queryPanel.selectedDataSource?.scope, shallow);
  const hasPermissions =
    selectedDataSourceScope === 'global'
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;
  const inputRef = useRef();

  useEffect(() => {
    setName(value);
  }, [value]);

  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isFocused]);

  const debouncedHandleInput = useCallback(
    debounce((newName) => {
      onInput(newName);
    }, 300),
    [onInput]
  );

  const handleChange = (event) => {
    const sanitizedValue = event.target.value.replace(/[ \t&]/g, '');
    setName(sanitizedValue);
    // debouncedHandleInput(sanitizedValue);
  };

  return (
    <div className="query-name-breadcrum d-flex align-items-center ms-1">
      <span
        className="query-manager-header-query-name font-weight-400"
        data-cy={`query-name-label`}
        style={{ width: '150px' }}
      >
        {isFocused ? (
          <input
            data-cy={`query-rename-input`}
            type="text"
            className={cx('border-indigo-09 bg-transparent query-rename-input py-1 px-2 rounded', {
              'text-white': darkMode,
            })}
            autoFocus
            ref={inputRef}
            onChange={handleChange}
            value={name}
            onKeyDown={(event) => {
              event.persist();
              if (event.keyCode === 13) {
                setIsFocused(false);
                debouncedHandleInput(event.target.value);
              }
            }}
            onBlur={({ target }) => {
              setIsFocused(false);
              debouncedHandleInput(target.value);
            }}
          />
        ) : (
          <Button
            size="sm"
            onClick={isDiabled ? null : () => setIsFocused(true)}
            disabled={isDiabled}
            className={cx(
              'bg-transparent justify-content-between color-slate12 w-100 px-2 py-1 rounded font-weight-500',
              {
                disabled: shouldFreeze || !hasPermissions,
              }
            )}
          >
            <span className="text-truncate">{decodeEntities(name)} </span>
            <span
              // className={cx('breadcrum-rename-query-icon', { 'd-none': isFocused && isVersionReleased })}
              className={cx('breadcrum-rename-query-icon', { 'd-none': isFocused })}
              style={{ minWidth: 14 }}
            >
              {(!isDiabled || !hasPermissions) && <RenameIcon />}
            </span>
          </Button>
        )}
      </span>
    </div>
  );
};

const RunButton = ({ buttonLoadingState, iconOnly }) => {
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const isInDraft = selectedQuery?.status === 'draft';
  const isLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  const isPreviewQueryLoading = useStore((state) => state.queryPanel.isPreviewQueryLoading);
  const isActive = isLoading || isPreviewQueryLoading;
  const isMac = typeof navigator !== 'undefined' && navigator?.userAgent?.toLowerCase().includes('mac');

  const shortcutDisplay = isMac ? 'Run query ⌘↩' : 'Run query Ctrl+Enter';
  return (
    <span>
      <ToolTip message={shortcutDisplay} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
        <ButtonComponent
          isLucid
          size="medium"
          variant="secondary"
          onClick={() => runQuery(selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true, undefined, true)}
          leadingIcon="play"
          disabled={isInDraft || isActive}
          isLoading={isLoading}
          iconOnly={iconOnly}
          className={iconOnly ? '' : isMac ? '!tw-w-[88px]' : '!tw-w-[120px]'}
          data-cy="query-run-button"
        >
          {!iconOnly && (
            <>
              Run
              <span className="query-manager-btn-shortcut">{isMac ? '⌘↩' : 'Ctrl+Enter'}</span>
            </>
          )}
        </ButtonComponent>
      </ToolTip>
    </span>
  );
};

const hasQueryMention = (text, queryName) => {
  if (!queryName || !text) return false;
  const escaped = queryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[ ,])@${escaped}(?=$|[ ,])`).test(text);
};

const GenerateQueryButton = ({ iconOnly }) => {
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const queryName = selectedQuery?.name ?? '';
  // Derived boolean so the component only re-renders when mention is added/removed, not on every keystroke
  const isQueryMentioned = useStore((state) => hasQueryMention(state.ai?.inputMessage ?? '', queryName));
  const [buttonPressedForQuery, setButtonPressedForQuery] = useState(null);
  const isAiBlockedByBranch = useIsAiBlockedOnDefaultBranch();
  const isLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  const isPreviewQueryLoading = useStore((state) => state.queryPanel.isPreviewQueryLoading);
  const isActive = isLoading || isPreviewQueryLoading;

  if (!featureAccess?.ai) return null;
  if (!GENERATE_QUERY_SUPPORTED_KINDS.includes(selectedDataSource?.kind)) return null;
  if (isActive) return null;

  const isPressed = buttonPressedForQuery === queryName && isQueryMentioned;

  const handleGenerateQuery = async () => {
    posthogHelper.captureEvent('click_generate_query', { dataSource: selectedDataSource?.kind });
    const store = useStore.getState();

    store.toggleLeftSidebar(true);
    store.setSelectedSidebarItem('tooljetai');

    if (isPressed) {
      requestAnimationFrame(() => store.ai.triggerChatInputFocus());
      return;
    }

    setButtonPressedForQuery(queryName);
    store.ai.setGenerateQuerySource({
      queryName,
      queryId: selectedQuery?.id,
      datasourceId: selectedDataSource?.id,
      datasourceName: selectedDataSource?.name,
      datasourceType: selectedDataSource?.kind,
    });
    await store.ai.createNewConversation();

    const current = store.ai.inputMessage;
    const mention = `@${queryName} `;
    store.ai.setInputMessage(current ? `${current} ${mention}` : mention);

    requestAnimationFrame(() => store.ai.triggerChatInputFocus());
  };

  const isRunJs = selectedDataSource?.kind === 'runjs';
  const buttonLabel = isRunJs ? 'Write custom code' : 'Generate query';
  const tooltipMessage = isRunJs ? 'Write custom code with AI' : 'Generate query with AI';

  return (
    <ToolTip message={tooltipMessage} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
      <span>
        <ButtonComponent
          size="medium"
          variant="ghost"
          aria-selected={isPressed}
          iconOnly={iconOnly}
          className={isPressed ? '!tw-bg-button-outline-hover' : ''}
          onClick={handleGenerateQuery}
          disabled={shouldFreeze || isAiBlockedByBranch}
          data-cy="query-generate-button"
        >
          <AITripleSparkles width="14" height="14" />
          {!iconOnly && buttonLabel}
        </ButtonComponent>
      </span>
    </ToolTip>
  );
};

const PreviewButton = ({ buttonLoadingState, onClick }) => {
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const hasPermissions =
    selectedDataSource?.scope === 'global' && selectedDataSource?.type !== DATA_SOURCE_TYPE.SAMPLE
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;
  const isPreviewQueryLoading = useStore((state) => state.queryPanel.isPreviewQueryLoading);
  const isLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  // Disable Preview while either run or preview is in flight — Abort first, then re-preview.
  // Also closes the queryAbortControllers race window for rapid re-clicks.
  const isActive = isLoading || isPreviewQueryLoading;
  const { t } = useTranslation();
  const isMac = typeof navigator !== 'undefined' && navigator?.userAgent?.toLowerCase().includes('mac');

  const shortcutDisplay = `Preview query ${isMac ? '⌘⇧↩' : 'Ctrl+Shift+Enter'}`;
  return (
    <ToolTip message={shortcutDisplay} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
      <ButtonComponent
        size="medium"
        variant="outline"
        onClick={onClick}
        // className="!tw-w-[100px]"
        disabled={!hasPermissions || isActive}
        isLoading={isPreviewQueryLoading}
        data-cy={'query-preview-button'}
      >
        Preview
      </ButtonComponent>
    </ToolTip>
  );
};

const ABORT_BUTTON_DELAY_MS = 3000;

const AbortButton = () => {
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const abortQuery = useStore((state) => state.queryPanel.abortQuery);
  const isLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  const isPreviewQueryLoading = useStore((state) => state.queryPanel.isPreviewQueryLoading);
  const isActive = isLoading || isPreviewQueryLoading;

  const [hasExceededDelay, setHasExceededDelay] = useState(false);
  useEffect(() => {
    if (!isActive) {
      setHasExceededDelay(false);
      return;
    }
    const timer = setTimeout(() => setHasExceededDelay(true), ABORT_BUTTON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isActive]);

  if (ABORT_UNSUPPORTED_KINDS.has(selectedQuery?.kind) || !isActive || !hasExceededDelay) return null;

  const isMac = typeof navigator !== 'undefined' && navigator?.userAgent?.toLowerCase().includes('mac');
  const shortcutDisplay = `Stop waiting for the response  ${isMac ? '⌘.' : 'Ctrl+.'}`;

  return (
    <ToolTip message={shortcutDisplay} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
      <ButtonComponent
        size="medium"
        variant="outline"
        onClick={() => abortQuery(selectedQuery?.id)}
        disabled={!isActive}
        leadingIcon="circle-slash"
        data-cy="query-abort-button"
        isLucid={true}
      >
        Abort
      </ButtonComponent>
    </ToolTip>
  );
};
