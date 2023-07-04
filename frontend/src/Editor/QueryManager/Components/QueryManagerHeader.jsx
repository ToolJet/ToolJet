import React, { useState, forwardRef, useRef, useEffect } from 'react';
import RunIcon from '../Icons/RunIcon';
import RenameIcon from '../Icons/RenameIcon';
import PreviewIcon from '../Icons/PreviewIcon';
import CreateIcon from '../Icons/CreateIcon';
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
import { useSelectedQuery, useSelectedDataSource, usePreviewLoading } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { Tooltip } from 'react-tooltip';

export const QueryManagerHeader = forwardRef(({ darkMode, currentState, options, editorRef, onNameChange }, ref) => {
  const { renameQuery, updateDataQueryStatus } = useDataQueriesActions();
  const selectedQuery = useSelectedQuery();
  const isCreationInProcess = useQueryCreationLoading();
  const isUpdationInProcess = useQueryUpdationLoading();
  const selectedDataSource = useSelectedDataSource();
  const queryName = selectedQuery?.name ?? '';
  const [renamingQuery, setRenamingQuery] = useState(false);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersionId: state.editingVersion?.id,
    }),
    shallow
  );

  const buttonDisabled = isUpdationInProcess || isCreationInProcess;
  const isInDraft = selectedQuery?.status === 'draft';

  const executeQueryNameUpdation = (newName) => {
    const { name } = selectedQuery;
    if (name === newName) {
      return setRenamingQuery(false);
    }
    const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      renameQuery(selectedQuery?.id, newName, editorRef);
      setRenamingQuery(false);
    } else {
      if (isNewQueryNameAlreadyExists) {
        toast.error('Query name already exists');
      }
      setRenamingQuery(false);
    }
  };

  const renderRenameInput = () => (
    <input
      data-cy={`query-rename-input`}
      type="text"
      className={cx('border-indigo-09 bg-transparent', { 'text-white': darkMode })}
      autoFocus
      defaultValue={queryName}
      onKeyUp={(event) => {
        event.persist();
        if (event.keyCode === 13) {
          executeQueryNameUpdation(event.target.value);
        }
      }}
      onBlur={({ target }) => executeQueryNameUpdation(target.value)}
    />
  );

  const renderBreadcrumb = () => {
    return (
      <>
        <div className="query-name-breadcrum d-flex align-items-center ms-3">
          <span
            className={cx('query-manager-header-query-name font-weight-400', {
              ellipsis: !renamingQuery && !!selectedQuery,
            })}
            data-cy={`query-name-label`}
          >
            {renamingQuery ? renderRenameInput() : queryName}
            {!selectedQuery ? <NewQueryNameInput onNameChange={onNameChange} darkMode={darkMode} /> : ''}
          </span>
          {selectedQuery ? (
            <span
              className={cx('breadcrum-rename-query-icon', { 'd-none': renamingQuery && isVersionReleased })}
              onClick={() => setRenamingQuery(true)}
            >
              <RenameIcon />
            </span>
          ) : (
            ''
          )}
        </div>
      </>
    );
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
        <span className="d-flex query-create-run-svg query-icon-wrapper">
          <CreateIcon />
        </span>
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
            className={cx('query-manager-btn-svg-wrapper d-flex align-item-center query-icon-wrapper query-run-svg', {
              invisible: isLoading,
            })}
          >
            <RunIcon />
          </span>
          <span className="query-manager-btn-name">{isLoading ? ' ' : 'Run'}</span>
        </button>
        {isInDraft && <Tooltip id="query-header-btn-run" className="tooltip" />}
      </span>
    );
  };

  const renderButtons = () => {
    if (selectedQuery === null) return;
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
      <div className="col font-weight-500">{renderBreadcrumb()}</div>
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
        <PreviewIcon />
      </span>
      <span>{t('editor.queryManager.preview', 'Preview')}</span>
    </button>
  );
};

const NewQueryNameInput = ({ darkMode, onNameChange }) => {
  const dataQueries = useDataQueries();
  const inputRef = useRef();
  const [value, setValue] = useState();

  useEffect(() => {
    const name = computeQueryName();
    setValue(name);
    onNameChange(name);
  }, []);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleNameInput = (name) => {
    if (dataQueries.find((query) => query.name === name) !== undefined) {
      onNameChange(null);
      return toast.error('Query name taken');
    }
    onNameChange(name);
  };

  const handleChange = (event) => {
    const sanitizedValue = event.target.value.replace(/[ \t&]/g, '');
    setValue(sanitizedValue);
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

  return (
    <input
      data-cy={`query-rename-input`}
      type="text"
      className={cx('border-indigo-09 bg-transparent', { 'text-white': darkMode })}
      autoFocus
      ref={inputRef}
      value={value}
      defaultValue={computeQueryName()}
      onChange={handleChange}
      onKeyUp={(event) => {
        event.persist();
        if (event.keyCode === 13) {
          handleNameInput(event.target.value);
          // executeQueryNameUpdation(event.target.value);
        }
      }}
      onBlur={({ target }) => handleNameInput(target.value)}
    />
  );
};
