import React, { useState, forwardRef, useRef, useEffect } from 'react';
import RenameIcon from '../Icons/RenameIcon';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { shallow } from 'zustand/shallow';
import { ToolTip } from '@/_components';
import { Button } from 'react-bootstrap';
import { decodeEntities } from '@/_helpers/utils';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';

export const QueryManagerHeader = forwardRef(({ darkMode, setActiveTab, activeTab }, ref) => {
  const moduleId = useModuleId();
  const updateQuerySuggestions = useStore((state) => state.queryPanel.updateQuerySuggestions);
  const previewQuery = useStore((state) => state.queryPanel.previewQuery);
  const renameQuery = useStore((state) => state.dataQuery.renameQuery);
  const checkExistingQueryName = useStore((state) => state.dataQuery.checkExistingQueryName);
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const selectedDataSource = useStore((state) => state.queryPanel.selectedDataSource);
  const showCreateQuery = useStore((state) => state.queryPanel.showCreateQuery);
  const setShowCreateQuery = useStore((state) => state.queryPanel.setShowCreateQuery);
  const queryName = selectedQuery?.name ?? '';
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

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

  const previewButtonOnClick = () => {
    const _options = { ...selectedQuery.options };
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

  return (
    <div className="row header" style={{ padding: '8px 16px' }}>
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
            <RunButton buttonLoadingState={buttonLoadingState} />
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
  const shouldFreeze = useStore((state) => state.getShouldFreeze());
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

  const handleChange = (event) => {
    const sanitizedValue = event.target.value.replace(/[ \t&]/g, '');
    setName(sanitizedValue);
  };

  const handleInput = (newName) => {
    const result = onInput(newName);
    if (!result) {
      setName(value);
    }
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
                handleInput(event.target.value);
              }
            }}
            onBlur={({ target }) => {
              setIsFocused(false);
              handleInput(target.value);
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

const RunButton = ({ buttonLoadingState }) => {
  const selectedQuery = useStore((state) => state.queryPanel.selectedQuery);
  const runQuery = useStore((state) => state.queryPanel.runQuery);
  const isInDraft = selectedQuery?.status === 'draft';
  const isLoading = useStore(
    (state) => state.resolvedStore.modules.canvas.exposedValues.queries[selectedQuery?.id]?.isLoading ?? false
  );
  const isMac = typeof navigator !== 'undefined' && navigator?.userAgent?.toLowerCase().includes('mac');

  const shortcutDisplay = isMac ? 'Run query ⌘↩' : 'Run query Ctrl+↩';
  return (
    <span>
      <ToolTip message={shortcutDisplay} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
        <ButtonComponent
          size="medium"
          variant="secondary"
          onClick={() => runQuery(selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true)}
          leadingIcon="play01"
          disabled={isInDraft}
          isLoading={isLoading}
          className={isMac ? '!tw-w-[88px]' : '!tw-w-[100px]'}
          data-cy="query-run-button"
        >
          Run
          <span className="query-manager-btn-shortcut">{isMac ? '⌘↩' : 'Ctrl+↩'}</span>
        </ButtonComponent>
      </ToolTip>
    </span>
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
  const { t } = useTranslation();
  const isMac = typeof navigator !== 'undefined' && navigator?.userAgent?.toLowerCase().includes('mac');

  const shortcutDisplay = `Preview query ${isMac ? '⌘↩' : 'Ctrl+⇧+↩'}`;
  return (
    <ToolTip message={shortcutDisplay} placement="bottom" trigger={['hover']} show={true} tooltipClassName="">
      <ButtonComponent
        size="medium"
        variant="outline"
        onClick={onClick}
        // className="!tw-w-[100px]"
        disabled={!hasPermissions}
        isLoading={isPreviewQueryLoading}
        data-cy={'query-preview-button'}
      >
        Preview
      </ButtonComponent>
    </ToolTip>
  );
};
