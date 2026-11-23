import React, { useState, useRef, useEffect } from 'react';
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
import TooljetAi from '@/_ui/Icon/solidIcons/TooljetAI';
import { useIsAiBlockedOnDefaultBranch } from '@/_hooks/useIsAiBlockedOnDefaultBranch';
import { useWriteQueryEntry } from '@/AppBuilder/QueryManager/_hooks/useWriteQueryEntry';
import { getPanelCloseLabel } from '@/AppBuilder/panelLayout';
import PanelHeader from '@/AppBuilder/Shared/Panel/PanelHeader';
import { DataSourceTypes } from '@/modules/common/components/DataSourceComponents';
import { getQueryDocumentation } from '@/AppBuilder/QueryManager/utils';
import { QueryInlineNameEditor } from './QueryInlineNameEditor';

const ICON_ONLY_BUTTON_BREAKPOINT = 700;
const HEADER_CONTROL_CLASS = 'query-header-control';

export const QueryManagerHeader = ({ darkMode, setActiveTab, activeTab }) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const updateQuerySuggestions = useStore((state) => state.queryPanel.updateQuerySuggestions);
  const previewQuery = useStore((state) => state.queryPanel.previewQuery);
  const renameQuery = useStore((state) => state.dataQuery.renameQuery);
  const checkExistingQueryName = useStore((state) => state.dataQuery.checkExistingQueryName);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const showCreateQuery = useStore((state) => state.queryPanel.showCreateQuery);
  const setShowCreateQuery = useStore((state) => state.queryPanel.setShowCreateQuery);
  const setActiveRightSideBarTab = useStore((state) => state.setActiveRightSideBarTab);
  const setRightSidebarOpen = useStore((state) => state.setRightSidebarOpen);
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
    previewQuery(query, false, undefined, moduleId).catch(({ error, data }) => {
      console.log(error, data);
    });
  };

  const closeQueryPanel = () => {
    setActiveRightSideBarTab(null);
    setRightSidebarOpen(false);
  };

  const iconOnly = headerWidth > 0 && headerWidth < ICON_ONLY_BUTTON_BREAKPOINT;
  const dataSourceMeta = DataSourceTypes.find((source) => source.kind === selectedDataSource?.kind);
  const queryDocumentation = getQueryDocumentation({ dataSourceMeta, selectedDataSource });

  return (
    <div className="query-manager-header" ref={headerRef}>
      <PanelHeader
        divider={false}
        titleClassName="query-manager-header__title"
        title={
          selectedQuery && (
            <NameInput
              onInput={executeQueryNameUpdation}
              selectedQuery={selectedQuery}
              value={queryName}
              isDiabled={shouldFreeze}
              queryDocumentation={queryDocumentation}
            />
          )
        }
        onClose={closeQueryPanel}
        closeLabel={getPanelCloseLabel('query')}
        closeDataCy="query-configuration-close-button"
      >
        {!(selectedQuery === null || showCreateQuery) && (
          <>
            {INLINE_AI_FEATURES_ENABLED && <GenerateQueryButton compact={iconOnly} />}
            <AbortButton />
            <RunButton buttonLoadingState={buttonLoadingState} compact={iconOnly} />
            <PreviewButton
              disabled={shouldFreeze}
              onClick={previewButtonOnClick}
              buttonLoadingState={buttonLoadingState}
            />
          </>
        )}
      </PanelHeader>
      {selectedQuery && <QueryTabs kind={selectedQuery.kind} activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
};

// Setup, Transformation and Settings: one Tab stop, the arrow keys (and Home / End) move between tabs.
const QueryTabs = ({ kind, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 1, label: 'Setup' },
    { id: 2, label: 'Transformation', hidden: TRANSFORMATION_DISABLED_KINDS.has(kind) },
    { id: 3, label: 'Settings' },
  ].filter((tab) => !tab.hidden);

  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);
    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActiveTab(tabs[next].id);
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="query-manager-tabs" role="tablist" aria-label="Query sections" onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={cx('query-manager-tab', { 'is-active': activeTab === tab.id })}
          data-cy={`query-tab-${tab.label.toLowerCase()}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

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

const RunButton = ({ buttonLoadingState, compact }) => {
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
          aria-label="Run query"
          disabled={isInDraft || isActive}
          isLoading={isLoading}
          iconOnly={compact}
          className={cx(HEADER_CONTROL_CLASS, !compact && (isMac ? '!tw-w-[88px]' : '!tw-w-[120px]'))}
          data-cy="query-run-button"
        >
          {!compact && (
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

const GenerateQueryButton = ({ compact }) => {
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
          aria-label={buttonLabel}
          iconOnly={compact}
          className={isPressed ? '!tw-bg-button-outline-hover' : ''}
          onClick={openChat}
          disabled={shouldFreeze || isAiBlockedByBranch}
          data-cy="query-generate-button"
        >
          <TooljetAi width="14" height="14" />
          {!compact && buttonLabel}
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
        disabled={!hasPermissions || isActive}
        isLoading={isPreviewQueryLoading}
        className={HEADER_CONTROL_CLASS}
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
