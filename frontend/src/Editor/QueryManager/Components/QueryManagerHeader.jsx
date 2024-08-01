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
import { useSelectedQueryLoadingState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { Tooltip } from 'react-tooltip';
import InputComponent from '@/components/ui/Input/Index';
import ButtonComponent from '@/components/ui/Button/Index';

export const QueryManagerHeader = forwardRef(({ darkMode, options, editorRef, setActiveTab, activeTab }, ref) => {
  const { renameQuery } = useDataQueriesActions();
  const selectedQuery = useSelectedQuery();
  const selectedDataSource = useSelectedDataSource();
  const [showCreateQuery, setShowCreateQuery] = useShowCreateQuery();
  const queryName = selectedQuery?.name ?? '';
  const isLoading = useSelectedQueryLoadingState();
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
      condition: selectedQuery?.kind !== 'runpy' && selectedQuery?.kind !== 'runjs',
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
        <ButtonComponent
          leadingIcon="rightarrrow"
          onClick={() => runQuery(editorRef, selectedQuery?.id, selectedQuery?.name, undefined, 'edit', {}, true)}
          variant="ghostBrand"
          data-cy="query-run-button"
          disabled={isInDraft}
          isLoading={isLoading}
          {...(isInDraft && {
            'data-tooltip-id': 'query-header-btn-run',
            'data-tooltip-content': 'Publish the query to run',
          })}
          className="tw-w-[80px]"
        >
          {isLoading ? ' ' : 'Run'}
        </ButtonComponent>
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
            value={queryName}
            darkMode={darkMode}
            isDiabled={isVersionReleased}
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

const PreviewButton = ({ buttonLoadingState, onClick, isRunButtonLoading }) => {
  const previewLoading = usePreviewLoading();
  const { t } = useTranslation();

  return (
    <ButtonComponent
      leadingIcon="eye"
      onClick={onClick}
      variant="outline"
      data-cy={'query-preview-button'}
      isLoading={previewLoading && !isRunButtonLoading}
      className="tw-w-[100px]"
    >
      Preview
    </ButtonComponent>
  );
};

const NameInput = ({ onInput, value, darkMode, isDiabled }) => {
  const [name, setName] = useState(value);

  useEffect(() => {
    setName(value);
  }, [value]);

  const handleChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[ \t&]/g, '');
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
        <InputComponent
          value={name}
          onChange={handleChange}
          size="small"
          type="editable title"
          data-cy={`query-rename-input`}
          disabled={isDiabled}
          onKeyDown={(event) => {
            event.persist();
            if (event.keyCode === 13) {
              handleInput(event.target.value);
            }
          }}
          onBlur={({ target }) => {
            handleInput(target.value);
          }}
        />
      </span>
    </div>
  );
};
