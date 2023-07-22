import React, { useState, forwardRef } from 'react';
import RunIcon from '../Icons/RunIcon';
import BreadcrumbsIcon from '../Icons/BreadcrumbsIcon';
import RenameIcon from '../Icons/RenameIcon';
import PreviewIcon from '../Icons/PreviewIcon';
import CreateIcon from '../Icons/CreateIcon';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import { useTranslation } from 'react-i18next';
import { previewQuery, checkExistingQueryName, runQuery } from '@/_helpers/appUtils';
import { useDataQueriesActions, useQueryCreationLoading, useQueryUpdationLoading } from '@/_stores/dataQueriesStore';
import { useSelectedQuery, useSelectedDataSource, useUnsavedChanges } from '@/_stores/queryPanelStore';
import ToggleQueryEditorIcon from '../Icons/ToggleQueryEditorIcon';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';

export const QueryManagerHeader = forwardRef(
  (
    {
      darkMode,
      mode,
      addNewQueryAndDeselectSelectedQuery,
      updateDraftQueryName,
      toggleQueryEditor,
      previewLoading = false,
      options,
      appId,
      editorRef,
    },
    ref
  ) => {
    const { renameQuery, updateDataQuery, createDataQuery } = useDataQueriesActions();
    const selectedQuery = useSelectedQuery();
    const isCreationInProcess = useQueryCreationLoading();
    const isUpdationInProcess = useQueryUpdationLoading();
    const isUnsavedQueriesAvailable = useUnsavedChanges();
    const selectedDataSource = useSelectedDataSource();
    const { t } = useTranslation();
    const queryName = selectedQuery?.name ?? '';
    const [renamingQuery, setRenamingQuery] = useState(false);
    const { queries } = useCurrentState((state) => ({ queries: state.queries }), shallow);
    const { isVersionReleased, editingVersionId } = useAppVersionStore(
      (state) => ({
        isVersionReleased: state.isVersionReleased,
        editingVersionId: state.editingVersion?.id,
      }),
      shallow
    );

    const buttonText = mode === 'edit' ? 'Save' : 'Create';
    const buttonDisabled = isUpdationInProcess || isCreationInProcess;

    const executeQueryNameUpdation = (newName) => {
      const { id, name } = selectedQuery;
      if (name === newName) {
        return setRenamingQuery(false);
      }
      const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
      if (newName && !isNewQueryNameAlreadyExists) {
        if (id === 'draftQuery') {
          toast.success('Query Name Updated');
          updateDraftQueryName(newName);
        } else {
          renameQuery(selectedQuery?.id, newName, editorRef);
        }
        setRenamingQuery(false);
      } else {
        if (isNewQueryNameAlreadyExists) {
          toast.error('Query name already exists');
        }
        setRenamingQuery(false);
      }
    };

    const createOrUpdateDataQuery = (shouldRunQuery = false) => {
      if (selectedQuery?.id === 'draftQuery') return createDataQuery(appId, editingVersionId, options, shouldRunQuery);
      if (isUnsavedQueriesAvailable) return updateDataQuery(options, shouldRunQuery);
      shouldRunQuery && runQuery(editorRef, selectedQuery?.id, selectedQuery?.name);
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
      if (selectedQuery === null) return;
      return (
        <>
          <span
            className={`${darkMode ? 'color-light-gray-c3c3c3' : 'color-light-slate-11'} 
          cursor-pointer font-weight-400`}
            onClick={addNewQueryAndDeselectSelectedQuery}
            data-cy={`query-type-header`}
          >
            {mode === 'create' ? 'New Query' : 'Queries'}
          </span>
          <span className="breadcrum">
            <BreadcrumbsIcon />
          </span>
          <div className="query-name-breadcrum d-flex align-items-center">
            <span
              className={cx('query-manager-header-query-name font-weight-400', { ellipsis: !renamingQuery })}
              data-cy={`query-name-label`}
            >
              {renamingQuery ? renderRenameInput() : queryName}
            </span>
            {!isVersionReleased && (
              <span
                className={cx('breadcrum-rename-query-icon', { 'd-none': renamingQuery && isVersionReleased })}
                onClick={() => setRenamingQuery(true)}
              >
                <RenameIcon />
              </span>
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
      const hasParamSupport = mode === 'create' || selectedQuery?.options?.hasParamSupport;
      previewQuery(editorRef, query, false, undefined, hasParamSupport)
        .then(() => {
          ref.current.scrollIntoView();
        })
        .catch(({ error, data }) => {
          console.log(error, data);
        });
    };

    const renderPreviewButton = () => {
      return (
        <button
          onClick={previewButtonOnClick}
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

    const renderSaveButton = () => {
      return (
        <button
          className={`default-tertiary-button ${buttonLoadingState(
            isCreationInProcess || isUpdationInProcess,
            isVersionReleased
          )}`}
          onClick={() => createOrUpdateDataQuery(false)}
          disabled={buttonDisabled}
          data-cy={`query-${buttonText.toLowerCase()}-button`}
        >
          <span className="d-flex query-create-run-svg query-icon-wrapper">
            <CreateIcon />
          </span>
          <span>{buttonText}</span>
        </button>
      );
    };

    const renderRunButton = () => {
      const { isLoading } = queries[selectedQuery?.name] ?? false;
      return (
        <button
          onClick={() => createOrUpdateDataQuery(true)}
          className={`border-0 default-secondary-button float-right1 ${buttonLoadingState(isLoading)}`}
          data-cy="query-run-button"
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
      );
    };

    const renderButtons = () => {
      if (selectedQuery === null) return;
      return (
        <>
          {renderPreviewButton()}
          {renderSaveButton()}
          {renderRunButton()}
        </>
      );
    };

    return (
      <div className="row header">
        <div className="col font-weight-500">{renderBreadcrumb()}</div>
        <div className="query-header-buttons">
          {renderButtons()}
          <span
            onClick={toggleQueryEditor}
            className={`toggle-query-editor-svg m-3`}
            data-tooltip-id="tooltip-for-hide-query-editor"
            data-tooltip-content="Hide query editor"
          >
            <ToggleQueryEditorIcon />
          </span>
          <Tooltip id="tooltip-for-hide-query-editor" className="tooltip" />
        </div>
      </div>
    );
  }
);
