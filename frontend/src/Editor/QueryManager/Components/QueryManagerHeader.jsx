import React, { useState, forwardRef, useRef, useEffect } from 'react';
import RenameIcon from '../Icons/RenameIcon';
import Eye1 from '@/_ui/Icon/solidIcons/Eye1';
import Play from '@/_ui/Icon/solidIcons/Play';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { previewQuery, checkExistingQueryName, runQuery } from '@/_helpers/appUtils';

import { useDataQueriesActions } from '@/_stores/dataQueriesStore';
import {
  useSelectedQuery,
  useSelectedDataSource,
  usePreviewLoading,
  useShowCreateQuery,
  useNameInputFocussed,
} from '@/_stores/queryPanelStore';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { Tooltip } from 'react-tooltip';
import { Button } from 'react-bootstrap';

export const QueryManagerHeader = forwardRef(({ darkMode, options, editorRef }, ref) => {
  const { renameQuery } = useDataQueriesActions();
  const selectedQuery = useSelectedQuery();
  const selectedDataSource = useSelectedDataSource();
  const [showCreateQuery, setShowCreateQuery] = useShowCreateQuery();
  const queryName = selectedQuery?.name ?? '';
  const { queries } = useCurrentState((state) => ({ queries: state.queries }), shallow);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersionId: state.editingVersion?.id,
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
    const hasParamSupport = selectedQuery?.options?.hasParamSupport;
    previewQuery(editorRef, query, false, undefined, hasParamSupport)
      .then(() => {
        ref.current.scrollIntoView();
      })
      .catch(({ error, data }) => {
        console.log(error, data);
      });
  };

  const renderRunButton = () => {
    const { isLoading } = queries[selectedQuery?.name] ?? false;
    return (
      <span
        {...(isInDraft && {
          'data-tooltip-id': 'query-header-btn-run',
          'data-tooltip-content': 'Connect a data source to run',
        })}
      >
        <button
          onClick={() => runQuery(editorRef, selectedQuery?.id, selectedQuery?.name)}
          className={`border-0 default-secondary-button float-right1 ${buttonLoadingState(
            isLoading,
            isVersionReleased
          )}`}
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
        <PreviewButton onClick={previewButtonOnClick} buttonLoadingState={buttonLoadingState} />
        {renderRunButton()}
      </>
    );
  };

  return (
    <div className="row header">
      <div className="col font-weight-500">
        {selectedQuery && <NameInput onInput={executeQueryNameUpdation} value={queryName} darkMode={darkMode} />}
      </div>
      <div className="query-header-buttons me-3">{renderButtons()}</div>
    </div>
  );
});

const PreviewButton = ({ buttonLoadingState, onClick }) => {
  const previewLoading = usePreviewLoading();
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className={`default-tertiary-button float-right1 ${buttonLoadingState(previewLoading)}`}
      data-cy={'query-preview-button'}
    >
      <span className="query-preview-svg d-flex align-items-center query-icon-wrapper">
        <Eye1 width={14} fill="var(--slate9)" />
      </span>
      <span>{t('editor.queryManager.preview', 'Preview')}</span>
    </button>
  );
};

const NameInput = ({ onInput, value, darkMode }) => {
  const [isFocussed, setIsFocussed] = useNameInputFocussed(false);
  const [name, setName] = useState(value);
  const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased);
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
            onClick={() => setIsFocussed(true)}
            className={'bg-transparent justify-content-between color-slate12 w-100 px-2 py-1 rounded font-weight-500'}
          >
            <span className="text-truncate">{name} </span>
            <span
              className={cx('breadcrum-rename-query-icon', { 'd-none': isFocussed && isVersionReleased })}
              style={{ minWidth: 14 }}
            >
              <RenameIcon />
            </span>
          </Button>
        )}
      </span>
    </div>
  );
};
