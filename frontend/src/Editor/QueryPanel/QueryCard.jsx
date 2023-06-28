import React, { useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { checkExistingQueryName } from '@/_helpers/appUtils';
import { Confirm } from '../Viewer/Confirm';
import { toast } from 'react-hot-toast';

import { useDataQueriesActions, useDataQueriesStore } from '@/_stores/dataQueriesStore';
import { useQueryPanelActions, useSelectedQuery, useUnsavedChanges } from '@/_stores/queryPanelStore';
import Copy from '../../_ui/Icon/solidIcons/Copy';
import DataSourceIcon from '../QueryManager/Components/DataSourceIcon';

export const QueryCard = ({
  dataQuery,
  setSaveConfirmation,
  darkMode = false,
  editorRef,
  isVersionReleased,
  appId,
}) => {
  const selectedQuery = useSelectedQuery();
  const isUnsavedChangesAvailable = useUnsavedChanges();
  const { isDeletingQueryInProcess } = useDataQueriesStore();
  const { deleteDataQueries, renameQuery, duplicateQuery } = useDataQueriesActions();
  const { setSelectedQuery, setSelectedDataSource, setUnSavedChanges, setPreviewData } = useQueryPanelActions();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [renamingQuery, setRenamingQuery] = useState(false);

  let isSeletedQuery = false;
  if (selectedQuery) {
    isSeletedQuery = dataQuery.id === selectedQuery.id;
  }

  const deleteDataQuery = (e) => {
    e.stopPropagation();
    setShowDeleteConfirmation(true);
  };

  const cancelDeleteDataQuery = () => {
    setShowDeleteConfirmation(false);
  };

  const updateQueryName = (selectedQuery, newName) => {
    const { id, name } = selectedQuery;
    if (name === newName) {
      return setRenamingQuery(false);
    }
    const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      renameQuery(dataQuery?.id, newName, editorRef);
      setRenamingQuery(false);
    } else {
      if (isNewQueryNameAlreadyExists) {
        toast.error('Query name already exists');
      }
      setRenamingQuery(false);
    }
  };

  const executeDataQueryDeletion = () => {
    setShowDeleteConfirmation(false);
    deleteDataQueries(dataQuery?.id, editorRef);
  };

  return (
    <>
      <div
        className={'row query-row pe-2' + (isSeletedQuery ? ' query-row-selected' : '')}
        key={dataQuery.id}
        onClick={() => {
          if (selectedQuery?.id === dataQuery?.id) return;
          const stateToBeUpdated = { editingQuery: true, selectedQuery: dataQuery };
          if (isUnsavedChangesAvailable) {
            setSaveConfirmation(true);
          } else {
            setSelectedQuery(dataQuery?.id);
            setPreviewData(null);
          }
        }}
        role="button"
      >
        <div className="col-auto query-icon d-flex">
          <DataSourceIcon source={dataQuery} />
        </div>
        <div className="col query-row-query-name">
          {renamingQuery ? (
            <input
              data-cy={`query-edit-input-field`}
              className={`query-name query-name-input-field border-indigo-09 bg-transparent  ${
                darkMode && 'text-white'
              }`}
              type="text"
              defaultValue={dataQuery.name}
              autoFocus={true}
              onKeyDown={({ target, key }) => {
                if (key === 'Enter') {
                  updateQueryName(selectedQuery, target.value);
                }
              }}
              onBlur={({ target }) => {
                updateQueryName(selectedQuery, target.value);
              }}
            />
          ) : (
            <OverlayTrigger
              trigger={['hover', 'focus']}
              placement="top"
              delay={{ show: 800, hide: 100 }}
              overlay={<Tooltip id="button-tooltip">{dataQuery.name}</Tooltip>}
            >
              <div className="query-name" data-cy={`list-query-${dataQuery.name.toLowerCase()}`}>
                <span className="text-truncate">{dataQuery.name}</span>{' '}
                {dataQuery.status === 'draft' && <small className="mx-2 text-secondary">Draft</small>}
              </div>
            </OverlayTrigger>
          )}
        </div>

        {!isVersionReleased && (
          <div className="col-auto query-rename-delete-btn">
            <div
              className={`col-auto ${renamingQuery && 'display-none'} rename-query`}
              onClick={() => setRenamingQuery(true)}
            >
              <span className="d-flex">
                <svg
                  data-cy={`edit-query-${dataQuery.name.toLowerCase()}`}
                  width="auto"
                  height="auto"
                  viewBox="0 0 19 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.7087 1.40712C14.29 0.826221 15.0782 0.499893 15.9 0.499893C16.7222 0.499893 17.5107 0.82651 18.0921 1.40789C18.6735 1.98928 19.0001 2.7778 19.0001 3.6C19.0001 4.42197 18.6737 5.21028 18.0926 5.79162C18.0924 5.79178 18.0928 5.79145 18.0926 5.79162L16.8287 7.06006C16.7936 7.11191 16.753 7.16118 16.7071 7.20711C16.6621 7.25215 16.6138 7.292 16.563 7.32665L9.70837 14.2058C9.52073 14.3942 9.26584 14.5 9 14.5H6C5.44772 14.5 5 14.0523 5 13.5V10.5C5 10.2342 5.10585 9.97927 5.29416 9.79163L12.1733 2.93697C12.208 2.88621 12.2478 2.83794 12.2929 2.79289C12.3388 2.74697 12.3881 2.70645 12.4399 2.67132L13.7079 1.40789C13.7082 1.40763 13.7084 1.40738 13.7087 1.40712ZM13.0112 4.92545L7 10.9153V12.5H8.58474L14.5745 6.48876L13.0112 4.92545ZM15.9862 5.07202L14.428 3.51376L15.1221 2.82211C15.3284 2.6158 15.6082 2.49989 15.9 2.49989C16.1918 2.49989 16.4716 2.6158 16.6779 2.82211C16.8842 3.02842 17.0001 3.30823 17.0001 3.6C17.0001 3.89177 16.8842 4.17158 16.6779 4.37789L15.9862 5.07202ZM0.87868 5.37868C1.44129 4.81607 2.20435 4.5 3 4.5H4C4.55228 4.5 5 4.94772 5 5.5C5 6.05228 4.55228 6.5 4 6.5H3C2.73478 6.5 2.48043 6.60536 2.29289 6.79289C2.10536 6.98043 2 7.23478 2 7.5V16.5C2 16.7652 2.10536 17.0196 2.29289 17.2071C2.48043 17.3946 2.73478 17.5 3 17.5H12C12.2652 17.5 12.5196 17.3946 12.7071 17.2071C12.8946 17.0196 13 16.7652 13 16.5V15.5C13 14.9477 13.4477 14.5 14 14.5C14.5523 14.5 15 14.9477 15 15.5V16.5C15 17.2957 14.6839 18.0587 14.1213 18.6213C13.5587 19.1839 12.7957 19.5 12 19.5H3C2.20435 19.5 1.44129 19.1839 0.87868 18.6213C0.31607 18.0587 0 17.2957 0 16.5V7.5C0 6.70435 0.31607 5.94129 0.87868 5.37868Z"
                    fill="#11181C"
                  />
                </svg>
              </span>
            </div>
            <div className={`col-auto rename-query`} onClick={() => duplicateQuery(dataQuery?.id, appId)}>
              <span className="d-flex">
                <Copy height={16} width={16} viewBox="0 5 20 20" />
              </span>
            </div>
            <div className="col-auto">
              {isDeletingQueryInProcess ? (
                <div className="px-2">
                  <div className="text-center spinner-border spinner-border-sm" role="status"></div>
                </div>
              ) : (
                <span className="delete-query" onClick={deleteDataQuery}>
                  <span className="d-flex">
                    <svg
                      data-cy={`delete-query-${dataQuery.name.toLowerCase()}`}
                      width="auto"
                      height="auto"
                      viewBox="0 0 18 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.58579 0.585786C5.96086 0.210714 6.46957 0 7 0H11C11.5304 0 12.0391 0.210714 12.4142 0.585786C12.7893 0.960859 13 1.46957 13 2V4H15.9883C15.9953 3.99993 16.0024 3.99993 16.0095 4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16.9201L15.9997 17.0458C15.9878 17.8249 15.6731 18.5695 15.1213 19.1213C14.5587 19.6839 13.7957 20 13 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.32687 18.5695 2.01223 17.8249 2.00035 17.0458L1.07987 6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H1.99054C1.9976 3.99993 2.00466 3.99993 2.0117 4H5V2C5 1.46957 5.21071 0.960859 5.58579 0.585786ZM3.0868 6L3.99655 16.917C3.99885 16.9446 4 16.9723 4 17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H13C13.2652 18 13.5196 17.8946 13.7071 17.7071C13.8946 17.5196 14 17.2652 14 17C14 16.9723 14.0012 16.9446 14.0035 16.917L14.9132 6H3.0868ZM11 4H7V2H11V4ZM6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L9 10.5858L10.2929 9.29289C10.6834 8.90237 11.3166 8.90237 11.7071 9.29289C12.0976 9.68342 12.0976 10.3166 11.7071 10.7071L10.4142 12L11.7071 13.2929C12.0976 13.6834 12.0976 14.3166 11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L9 13.4142L7.70711 14.7071C7.31658 15.0976 6.68342 15.0976 6.29289 14.7071C5.90237 14.3166 5.90237 13.6834 6.29289 13.2929L7.58579 12L6.29289 10.7071Z"
                        fill="#DB4324"
                      />
                    </svg>
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {showDeleteConfirmation ? (
        <Confirm
          show={showDeleteConfirmation}
          message={'Do you really want to delete this query?'}
          confirmButtonLoading={isDeletingQueryInProcess}
          onConfirm={executeDataQueryDeletion}
          darkMode={darkMode}
        />
      ) : null}
    </>
  );
};
