import React, { useState } from 'react';
import { Tooltip } from 'react-tooltip';
import { ToolTip } from '@/_components/ToolTip';
import { updateQuerySuggestions } from '@/_helpers/appUtils';
// import { Confirm } from '../Viewer/Confirm';
import { toast } from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import DataSourceIcon from '../QueryManager/Components/DataSourceIcon';
import { isQueryRunnable, decodeEntities } from '@/_helpers/utils';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import useStore from '@/AppBuilder/_stores/store';
//TODO: Remove this
import { Confirm } from '@/Editor/Viewer/Confirm';
// TODO: enable delete query confirmation popup
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { QueryRenameInput } from './QueryRenameInput';

export const QueryCard = ({ dataQuery, darkMode = false, localDs }) => {
  const isQuerySelected = useStore((state) => state.queryPanel.isQuerySelected(dataQuery.id), shallow);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery);
  const checkExistingQueryName = useStore((state) => state.dataQuery.checkExistingQueryName);
  const selectedDataSourceScope = useStore((state) => state.queryPanel.selectedDataSource?.scope);
  const isDeletingQueryInProcess = useStore((state) => state.dataQuery.isDeletingQueryInProcess);
  const renameQuery = useStore((state) => state.dataQuery.renameQuery);
  const deleteDataQueries = useStore((state) => state.dataQuery.deleteDataQueries);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);
  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  const renamingQueryId = useStore((state) => state.queryPanel.renamingQueryId);
  const deletingQueryId = useStore((state) => state.queryPanel.deletingQueryId);
  const setRenamingQuery = useStore((state) => state.queryPanel.setRenamingQuery);
  const deleteDataQuery = useStore((state) => state.queryPanel.deleteDataQuery);
  const isRenaming = renamingQueryId === dataQuery.id;
  const isDeleting = deletingQueryId === dataQuery.id;

  const hasPermissions =
    selectedDataSourceScope === 'global'
      ? canUpdateDataSource(dataQuery?.data_source_id) ||
      canReadDataSource(dataQuery?.data_source_id) ||
      canDeleteDataSource()
      : true;

  const toggleQueryHandlerMenu = useStore((state) => state.queryPanel.toggleQueryHandlerMenu);
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const isRestricted = dataQuery.permissions && dataQuery.permissions.length !== 0;

  const updateQueryName = (dataQuery, newName) => {
    const { name } = dataQuery;
    if (name === newName) {
      return setRenamingQuery(null);
    }
    const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      renameQuery(dataQuery?.id, newName);
      setRenamingQuery(null);
      updateQuerySuggestions(name, newName);
    } else {
      if (isNewQueryNameAlreadyExists) {
        toast.error('Query name already exists');
      }
      setRenamingQuery(null);
    }
  };

  const executeDataQueryDeletion = () => {
    deleteDataQuery(null);
    deleteDataQueries(dataQuery?.id);
    setPreviewData(null);
  };

  const getTooltip = () => {
    const permission = dataQuery.permissions?.[0];
    if (!permission) return null;

    const users = permission.groups || permission.users || [];
    if (users.length === 0) return null;

    const isSingle = permission.type === 'SINGLE';
    const isGroup = permission.type === 'GROUP';

    if (isSingle) {
      return users.length === 1
        ? `Access restricted to ${users[0].user.email}`
        : `Access restricted to ${users.length} users`;
    }

    if (isGroup) {
      return users.length === 1
        ? `Access restricted to ${users[0].permission_group?.name || users[0].permissionGroup?.name} group`
        : `Access restricted to ${users.length} user groups`;
    }

    return null;
  };

  return (
    <>
      <div
        className={`row query-row pe-2 ${darkMode && 'dark-theme'}` + (isQuerySelected ? ' query-row-selected' : '')}
        key={dataQuery.id}
        onClick={(e) => {
          if (isQuerySelected) return;
          if (!shouldFreeze) {
            const menuBtn = document.getElementById(`query-handler-menu-${dataQuery?.id}`);
            if (menuBtn.contains(e.target)) {
              e.stopPropagation();
            } else {
              toggleQueryHandlerMenu(false);
            }
          }
          setTimeout(() => {
            setSelectedQuery(dataQuery?.id);
            setPreviewData(null);
          }, 0);
        }}
        role="button"
      >
        <div className="col-auto query-icon d-flex">
          <DataSourceIcon source={dataQuery} height={16} />
        </div>
        <div className="col query-row-query-name">
          {isRenaming ? (
            <QueryRenameInput
              dataQuery={dataQuery}
              darkMode={darkMode}
              onUpdate={updateQueryName}
            />
          ) : (
            <div className="query-name" data-cy={`list-query-${dataQuery.name.toLowerCase()}`}>
              <span
                className="text-truncate"
                data-tooltip-id="query-card-name-tooltip"
                data-tooltip-content={decodeEntities(dataQuery.name)}
                data-tooltip-dynamic="true"
              >
                {decodeEntities(dataQuery.name)}
              </span>
              <ToolTip message={getTooltip()} show={licenseValid && isRestricted}>
                <div className="d-flex align-items-center" style={{ marginLeft: '8px', marginRight: 'auto' }}>
                  {licenseValid && isRestricted && <SolidIcon width="16" name="lock" fill="var(--icon-strong)" />}
                </div>
              </ToolTip>{' '}
              {!isQueryRunnable(dataQuery) && <small className="mx-2 text-secondary">Draft</small>}
              {localDs && (
                <>
                  <a
                    className="text-truncate"
                    data-tooltip-id="query-card-local-ds-info"
                    href="https://docs.tooljet.ai/docs/data-sources/overview/#changing-scope-of-data-sources-on-an-app-created-on-older-versions-of-tooljet"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={`assets/images/icons/warning.svg`} style={{ height: '20px' }} alt="Warning" />
                  </a>{' '}
                  <Tooltip id="query-card-local-ds-info" className="tooltip" place="right" style={{ width: '200px' }}>
                    Important <br />
                    Local Data sources will be deprecated soon. Switch to Global Data sources for continued support
                  </Tooltip>
                </>
              )}
            </div>
          )}
        </div>
        {!shouldFreeze && <div className={`col-auto query-rename-delete-btn ${isQuerySelected ? 'd-flex' : 'd-none'}`}>
          <ButtonComponent
            iconOnly
            leadingIcon="morevertical01"
            onClick={(e) => toggleQueryHandlerMenu(true, `query-handler-menu-${dataQuery?.id}`)}
            size="small"
            variant="outline"
            className=""
            id={`query-handler-menu-${dataQuery?.id}`}
            data-cy={`delete-query-${dataQuery.name.toLowerCase()}`}
          />
        </div>}
      </div>
      <Confirm
        show={isDeleting}
        message={'Do you really want to delete this query?'}
        confirmButtonLoading={isDeletingQueryInProcess}
        onConfirm={executeDataQueryDeletion}
        onCancel={() => deleteDataQuery(null)}
        darkMode={darkMode}
      />
    </>
  );
};
