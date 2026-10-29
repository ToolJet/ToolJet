import React, { useState, forwardRef, useRef, useEffect } from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { DATA_SOURCE_TYPE, INLINE_AI_FEATURES_ENABLED } from '@/_helpers/constants';
import {
  ABORT_UNSUPPORTED_KINDS,
  AI_QUERY_SUPPORTED_KINDS,
  TRANSFORMATION_DISABLED_KINDS,
} from '@/AppBuilder/QueryManager/constants';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import useStore from '@/AppBuilder/_stores/store';
import { useContainerWidth } from '@/_hooks/useContainerWidth';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { useAppDataStore } from '@/_stores/appDataStore';
import AITripleSparkles from '@/_ui/Icon/solidIcons/AITripleSparkles';
import { useIsAiBlockedOnDefaultBranch } from '@/_hooks/useIsAiBlockedOnDefaultBranch';
import { useWriteQueryEntry } from '@/AppBuilder/QueryManager/_hooks/useWriteQueryEntry';
import {
  getQueryHeaderClassName,
  getQueryHeaderControlPresentation,
  getQueryTabClassName,
  getQueryTabsStyle,
} from '@/AppBuilder/panelLayout';
import { DataSourceTypes } from '@/modules/common/components/DataSourceComponents';
import { getQueryDocumentation } from '@/AppBuilder/QueryManager/utils';
import { QueryInlineNameEditor } from './QueryInlineNameEditor';
import OpenCodeEditorTabButton from '@/AppBuilder/QueryManager/CodeEditorTab/OpenCodeEditorTabButton';

const ICON_ONLY_BUTTON_BREAKPOINT = 700;

export const QueryManagerHeader = forwardRef(({ darkMode, setActiveTab, activeTab, surface = 'bottom' }, ref) => {
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
      return 'Query name already exists';
    }

    if (newName) {
      renameQuery(selectedQuery?.id, newName);
      updateQuerySuggestions(name, newName);
      return '';
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
    { id: 1, key: 'setup', label: 'Setup' },
    {
      id: 2,
      key: 'transformation',
      label: 'Transformation',
      condition: !TRANSFORMATION_DISABLED_KINDS.has(selectedQuery?.kind),
    },
    { id: 3, key: 'settings', label: 'Settings' },
  ];

  const iconOnly = headerWidth > 0 && headerWidth < ICON_ONLY_BUTTON_BREAKPOINT;
  const dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedDataSource?.kind);
  const queryDocumentation = getQueryDocumentation({ dataSourceMeta, selectedDataSource });

  return (
    <div
      className={getQueryHeaderClassName(surface)}
      style={surface === 'right' ? undefined : { padding: '8px 16px' }}
      ref={headerRef}
    >
      <div className="col font-weight-500 p-0">
        {selectedQuery && (
          <NameInput
            onInput={executeQueryNameUpdation}
            selectedQuery={selectedQuery}
            value={queryName}
            isDiabled={shouldFreeze}
            queryDocumentation={queryDocumentation}
          />
        )}
        {selectedQuery && (
          <div className="query-manager-tabs d-flex" style={getQueryTabsStyle(surface)} role="tablist">
            {tabs.map(
              (tab) =>
                (tab.condition === undefined || tab.condition) && (
                  <p
                    key={tab.id}
                    data-cy={`query-tab-${tab.label.toLowerCase()}`}
                    data-tab-key={tab.key}
                    className={cx(
                      'm-0 d-flex align-items-center h-100',
                      getQueryTabClassName(surface, activeTab === tab.id)
                    )}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    style={
                      surface === 'right'
                        ? undefined
                        : {
                            borderBottom: activeTab === tab.id ? '2px solid #3E63DD' : '',
                            cursor: 'pointer',
                            padding: '0px 8px 6px 8px',
                            color: activeTab === tab.id ? 'var(--text-default)' : 'var(--text-placeholder)',
                          }
                    }
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
            {INLINE_AI_FEATURES_ENABLED && <GenerateQueryButton iconOnly={iconOnly} />}
            <AbortButton />
            <OpenCodeEditorTabButton />
            <RunButton buttonLoadingState={buttonLoadingState} iconOnly={iconOnly} />
            <PreviewButton
              disabled={shouldFreeze}
              onClick={previewButtonOnClick}
              buttonLoadingState={buttonLoadingState}
              surface={surface}
            />
          </>
        )}
      </div>
    </div>
  );
});

const NameInput = ({ onInput, value, isDiabled, selectedQuery, queryDocumentation }) => {
  const { isModuleEditor } = useModuleContext();
  const shouldFreeze = useStore((state) => state.getShouldFreeze(false, isModuleEditor));
  const isFocused = useStore((state) => state.queryPanel.nameInputFocused, shallow);
  const setIsFocused = useStore((state) => state.queryPanel.setNameInputFocused, shallow);
  const selectedDataSourceScope = useStore((state) => state.queryPanel.selectedDataSource?.scope, shallow);
  const hasPermissions =
    selectedDataSourceScope === 'global'
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;
  return (
    <div data-param="name" className="query-name-breadcrum d-flex align-items-center ms-1">
      <QueryInlineNameEditor
        value={value}
        isEditing={isFocused}
        onEditingChange={setIsFocused}
        onSave={onInput}
        disabled={isDiabled || shouldFreeze || !hasPermissions}
        queryDocumentation={queryDocumentation}
      />
    </div>
  );
};

const RunButton = ({ buttonLoadingState, iconOnly }) => {
  const control = getQueryHeaderControlPresentation('run');
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
          size={control.size}
          variant="secondary"
          onClick={() => runQuery(selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true, undefined, true)}
          leadingIcon="play"
          disabled={isInDraft || isActive}
          isLoading={isLoading}
          iconOnly={iconOnly}
          className={cx(control.className, !iconOnly && (isMac ? '!tw-w-[88px]' : '!tw-w-[120px]'))}
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

const GenerateQueryButton = ({ iconOnly }) => {
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  // The hook owns the mention bookkeeping; it re-renders only when the mention is added/removed,
  // not on every keystroke.
  const { openChat, isPressed } = useWriteQueryEntry('query');
  const isAiBlockedByBranch = useIsAiBlockedOnDefaultBranch();
  const isLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  const isPreviewQueryLoading = useStore((state) => state.queryPanel.isPreviewQueryLoading);
  const isActive = isLoading || isPreviewQueryLoading;

  if (!featureAccess?.ai) return null;
  if (!AI_QUERY_SUPPORTED_KINDS.includes(selectedDataSource?.kind)) return null;
  if (isActive) return null;

  const isRunJs = selectedDataSource?.kind === 'runjs';
  // "Write" rather than "Generate": the same button now also modifies an existing query and its
  // transformation, and "write" is the developer-facing verb for both.
  const buttonLabel = isRunJs ? 'Write custom code' : 'Write query';
  const tooltipMessage = isRunJs ? 'Write custom code with AI' : 'Write query with AI';

  return (
    <ToolTip message={tooltipMessage} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
      <span>
        <ButtonComponent
          size="medium"
          variant="ghost"
          aria-selected={isPressed}
          iconOnly={iconOnly}
          className={isPressed ? '!tw-bg-button-outline-hover' : ''}
          onClick={openChat}
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

const PreviewButton = ({ buttonLoadingState, onClick, surface }) => {
  const control = getQueryHeaderControlPresentation('preview', surface);
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
        size={control.size}
        variant="outline"
        onClick={onClick}
        // className="!tw-w-[100px]"
        disabled={!hasPermissions || isActive}
        isLoading={isPreviewQueryLoading}
        className={control.className}
        style={control.style}
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
