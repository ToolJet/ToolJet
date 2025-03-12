import React, { useState, forwardRef, useRef, useEffect } from 'react';
import RenameIcon from '../Icons/RenameIcon';
import Eye1 from '@/_ui/Icon/solidIcons/Eye1';
import Play from '@/_ui/Icon/solidIcons/Play';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { previewQuery, checkExistingQueryName, runQuery, updateQuerySuggestions } from '@/_helpers/appUtils';
import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import {
  useSelectedQuery,
  useSelectedDataSource,
  usePreviewLoading,
  useShowCreateQuery,
  useNameInputFocussed,
} from '@/_stores/queryPanelStore';
import { useSelectedQueryLoadingState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { Tooltip } from 'react-tooltip';
import { Button } from 'react-bootstrap';
import { decodeEntities } from '@/_helpers/utils';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';

export const QueryManagerHeader = forwardRef(({ darkMode, options, editorRef, setActiveTab, activeTab }, ref) => {
  const { renameQuery } = useDataQueriesActions();
  const selectedQuery = useSelectedQuery();
  const selectedDataSource = useSelectedDataSource();
  const [showCreateQuery, setShowCreateQuery] = useShowCreateQuery();
  const queryName = selectedQuery?.name ?? '';
  const isLoading = useSelectedQueryLoadingState();
  const { isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

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
      renameQuery(selectedQuery?.id, newName, editorRef);
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
    const _options = { ...options };
    const query = {
      data_source_id: selectedDataSource.id === 'null' ? null : selectedDataSource.id,
      pluginId: selectedDataSource.pluginId,
      options: _options,
      kind: selectedDataSource.kind,
      name: queryName,
    };
    previewQuery(editorRef, query, false, undefined)
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
      condition:
        selectedQuery?.kind !== 'runpy' && selectedQuery?.kind !== 'runjs' && selectedQuery?.kind !== 'workflows',
    },
    { id: 3, label: 'Settings' },
  ];

  const renderRunButton = () => {
    return (
      <span
        {...(isInDraft && {
          'data-tooltip-id': 'query-header-btn-run',
          'data-tooltip-content': 'Connect a data source to run',
        })}
      >
        <button
          onClick={() => runQuery(editorRef, selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true)}
          className={`border-0 default-secondary-button  ${buttonLoadingState(isLoading)}`}
          data-cy="query-run-button"
          disabled={isInDraft}
          {...(isInDraft && {
            'data-tooltip-id': 'query-header-btn-run',
            'data-tooltip-content': 'Publish the query to run',
          })}
        >
          <span
            className={cx({
              invisible: isLoading,
            })}
          >
            <Play width={14} fill="var(--indigo9)" viewBox="0 0 14 14" />
          </span>
          <span className="query-manager-btn-name">{isLoading ? ' ' : 'Run'}</span>
        </button>
        {isInDraft && <Tooltip id="query-header-btn-run" className="tooltip" />}
      </span>
    );
  };

  const renderButtons = () => {
    if (selectedQuery === null || showCreateQuery) return;
    return (
      <>
        {renderRunButton()}
        <PreviewButton
          selectedQuery={selectedQuery}
          disabled={isVersionReleased || isEditorFreezed}
          onClick={previewButtonOnClick}
          buttonLoadingState={buttonLoadingState}
          isRunButtonLoading={isLoading}
        />
      </>
    );
  };

  return (
    <div className="row header" style={{ padding: '8px 16px' }}>
      <div className="col font-weight-500 p-0">
        {selectedQuery && (
          <NameInput
            onInput={executeQueryNameUpdation}
            selectedQuery={selectedQuery}
            value={queryName}
            darkMode={darkMode}
            isDiabled={isVersionReleased || isEditorFreezed}
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
      <div className="query-header-buttons">{renderButtons()}</div>
    </div>
  );
});

const PreviewButton = ({ buttonLoadingState, onClick, selectedQuery, isRunButtonLoading }) => {
  const previewLoading = usePreviewLoading();
  const selectedDataSource = useSelectedDataSource();
  const hasPermissions =
    selectedDataSource?.scope === 'global' && selectedDataSource?.type !== DATA_SOURCE_TYPE.SAMPLE
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;
  const { t } = useTranslation();

  return (
    <button
      disabled={!hasPermissions}
      onClick={onClick}
      className={cx(`default-tertiary-button ${buttonLoadingState(previewLoading && !isRunButtonLoading)}`, {
        disabled: !hasPermissions,
      })}
      data-cy={'query-preview-button'}
    >
      <span className="query-preview-svg d-flex align-items-center query-icon-wrapper">
        <Eye1 width={14} fill="var(--slate9)" />
      </span>
      <span>{t('editor.queryManager.preview', 'Preview')}</span>
    </button>
  );
};

const NameInput = ({ onInput, value, darkMode, isDiabled, selectedQuery }) => {
  const [isFocussed, setIsFocussed] = useNameInputFocussed(false);
  const [name, setName] = useState(value);
  const selectedDataSource = useSelectedDataSource();
  const hasPermissions =
    selectedDataSource?.scope === 'global'
      ? canUpdateDataSource(selectedQuery?.data_source_id) ||
        canReadDataSource(selectedQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;
  const { isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );
  const inputRef = useRef();

  useEffect(() => {
    setName(value);
  }, [value]);

  useEffect(() => {
    if (isFocussed) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isFocussed]);

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
        {isFocussed ? (
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
                setIsFocussed(false);
                handleInput(event.target.value);
              }
            }}
            onBlur={({ target }) => {
              setIsFocussed(false);
              handleInput(target.value);
            }}
          />
        ) : (
          <Button
            size="sm"
            onClick={isDiabled ? null : () => setIsFocussed(true)}
            disabled={isDiabled}
            className={cx(
              'bg-transparent justify-content-between color-slate12 w-100 px-2 py-1 rounded font-weight-500',
              {
                disabled: isVersionReleased || isEditorFreezed || !hasPermissions,
              }
            )}
          >
            <span className="text-truncate">{decodeEntities(name)} </span>
            <span
              className={cx('breadcrum-rename-query-icon', { 'd-none': isFocussed && isVersionReleased })}
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
