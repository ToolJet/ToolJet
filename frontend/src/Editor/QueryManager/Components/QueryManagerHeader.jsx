import React, { useState, forwardRef, useRef, useEffect } from 'react';
import RenameIcon from '../Icons/RenameIcon';
import FloppyDisk from '@/_ui/Icon/solidIcons/FloppyDisk';
import Eye1 from '@/_ui/Icon/solidIcons/Eye1';
import Play from '@/_ui/Icon/solidIcons/Play';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { previewQuery, checkExistingQueryName, runQuery } from '@/_helpers/appUtils';

import {
  useDataQueriesActions,
  useQueryCreationLoading,
  useQueryUpdationLoading,
  useDataQueries,
} from '@/_stores/dataQueriesStore';
import {
  useSelectedQuery,
  useSelectedDataSource,
  usePreviewLoading,
  useShowCreateQuery,
} from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { Tooltip } from 'react-tooltip';
import { Button } from 'react-bootstrap';

export const QueryManagerHeader = forwardRef(({ darkMode, currentState, options, editorRef, onNameChange }, ref) => {
  const { renameQuery, updateDataQueryStatus } = useDataQueriesActions();
  const selectedQuery = useSelectedQuery();
  const isCreationInProcess = useQueryCreationLoading();
  const isUpdationInProcess = useQueryUpdationLoading();
  const selectedDataSource = useSelectedDataSource();
  const [showCreateQuery, setShowCreateQuery] = useShowCreateQuery();
  const queryName = selectedQuery?.name ?? '';
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
  }, [selectedQuery?.name]);

  const buttonDisabled = isUpdationInProcess || isCreationInProcess;
  const isInDraft = selectedQuery?.status === 'draft';

  const executeQueryNameUpdation = (newName) => {
    const { name } = selectedQuery;
    if (name === newName) {
      return;
    }
    const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      renameQuery(selectedQuery?.id, newName, editorRef);
    } else {
      if (isNewQueryNameAlreadyExists) {
        toast.error('Query name already exists');
      }
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
    };
    previewQuery(editorRef, query)
      .then(() => {
        ref.current.scrollIntoView();
      })
      .catch(({ error, data }) => {
        console.log(error, data);
      });
  };

  const renderSaveButton = () => {
    return (
      <button
        className={`default-tertiary-button ${buttonLoadingState(false, isVersionReleased)}`}
        onClick={() => updateDataQueryStatus('published')}
        disabled={buttonDisabled}
        data-cy={`query-publish-button`}
      >
        <FloppyDisk width={14} fill="var(--slate9)" />
        <span>Publish</span>
      </button>
    );
  };

  const renderRunButton = () => {
    const { isLoading } = currentState?.queries[selectedQuery?.name] ?? false;
    return (
      <span
        {...(isInDraft && {
          'data-tooltip-id': 'query-header-btn-run',
          'data-tooltip-content': 'Publish the query to run',
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
        {isInDraft && renderSaveButton()}
        <PreviewButton onClick={previewButtonOnClick} buttonLoadingState={buttonLoadingState} />
        {renderRunButton()}
      </>
    );
  };

  return (
    <div className="row header">
      <div className="col font-weight-500">
        {!selectedQuery && showCreateQuery ? (
          <NewQueryNameInput onNameChange={onNameChange} darkMode={darkMode} isFocussed={showCreateQuery} />
        ) : (
          <NameInput onInput={executeQueryNameUpdation} value={queryName} darkMode={darkMode} />
        )}
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

const NewQueryNameInput = ({ darkMode, onNameChange, isFocussed }) => {
  const dataQueries = useDataQueries();
  const [value, setValue] = useState();

  useEffect(() => {
    const name = computeQueryName();
    setValue(name);
    onNameChange(name);
  }, []);

  const handleNameInput = (name) => {
    if (dataQueries.find((query) => query.name === name) !== undefined) {
      onNameChange(null);
      return toast.error('Query name taken');
    }
    onNameChange(name);
  };

  const computeQueryName = () => {
    let currentNumber = dataQueries.length + 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const newName = `query_${currentNumber}`;
      if (dataQueries.find((query) => query.name === newName) === undefined) {
        return newName;
      }
      currentNumber += 1;
    }
  };

  return <NameInput onInput={handleNameInput} value={value} darkMode={darkMode} isFocussed={isFocussed} />;
};

const NameInput = ({ onInput, value, darkMode, isFocussed: _isFocussed }) => {
  const [isFocussed, setIsFocussed] = useState(false);
  const [name, setName] = useState(value);
  const isVersionReleased = useAppVersionStore((state) => state.isVersionReleased);
  const inputRef = useRef();

  useEffect(() => {
    setName(value);
  }, [value]);

  useEffect(() => {
    setIsFocussed(_isFocussed);
  }, [_isFocussed]);

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
                onInput(event.target.value);
              }
            }}
            onBlur={({ target }) => {
              setIsFocussed(false);
              onInput(target.value);
            }}
          />
        ) : (
          <Button
            size="sm"
            onClick={() => setIsFocussed(true)}
            className={'bg-transparent justify-content-between color-slate12 w-100 px-2 py-1 rounded font-weight-500'}
          >
            {value}{' '}
            <span
              className={cx('breadcrum-rename-query-icon', { 'd-none': isFocussed && isVersionReleased })}
              // onClick={() => setIsFocussed(true)}
            >
              <RenameIcon />
            </span>
          </Button>
        )}
      </span>
    </div>
  );
};
