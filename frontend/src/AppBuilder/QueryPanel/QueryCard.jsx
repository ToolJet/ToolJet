import React, { useState, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import { ToolTip } from '@/_components/ToolTip';
import { updateQuerySuggestions } from '@/_helpers/appUtils';
// import { Confirm } from '../Viewer/Confirm';
import { toast } from 'react-hot-toast';
import { shallow } from 'zustand/shallow';
import Copy from '@/_ui/Icon/solidIcons/Copy';
import DataSourceIcon from '../QueryManager/Components/DataSourceIcon';
import { isQueryRunnable, decodeEntities } from '@/_helpers/utils';
import { canDeleteDataSource, canReadDataSource, canUpdateDataSource } from '@/_helpers';
import useStore from '@/AppBuilder/_stores/store';
//TODO: Remove this
import { Confirm } from '@/Editor/Viewer/Confirm';
// TODO: enable delete query confirmation popup
import { debounce } from 'lodash';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';
import Edit from '@/_ui/Icon/bulkIcons/Edit';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import classNames from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const QueryCard = ({ dataQuery, darkMode = false, localDs }) => {
  const appId = useStore((state) => state.app.appId);

  const isQuerySelected = useStore((state) => state.queryPanel.isQuerySelected(dataQuery.id), shallow);
  const setSelectedQuery = useStore((state) => state.queryPanel.setSelectedQuery);
  const checkExistingQueryName = useStore((state) => state.dataQuery.checkExistingQueryName);
  const selectedDataSourceScope = useStore((state) => state.queryPanel.selectedDataSource?.scope);
  const isDeletingQueryInProcess = useStore((state) => state.dataQuery.isDeletingQueryInProcess);
  const renameQuery = useStore((state) => state.dataQuery.renameQuery);
  const deleteDataQueries = useStore((state) => state.dataQuery.deleteDataQueries);
  const duplicateQuery = useStore((state) => state.dataQuery.duplicateQuery);
  const setPreviewData = useStore((state) => state.queryPanel.setPreviewData);
  const toggleQueryPermissionModal = useStore((state) => state.queryPanel.toggleQueryPermissionModal);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showQueryMenu, setShowQueryMenu] = useState(false);
  const hasPermissions =
    selectedDataSourceScope === 'global'
      ? canUpdateDataSource(dataQuery?.data_source_id) ||
        canReadDataSource(dataQuery?.data_source_id) ||
        canDeleteDataSource()
      : true;

  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;

  const shouldFreeze = useStore((state) => state.getShouldFreeze());

  const QUERY_MENU_OPTIONS = [
    {
      label: 'Rename',
      value: 'rename',
      icon: <Edit width={16} />,
      showTooltip: false,
    },
    {
      label: 'Duplicate',
      value: 'duplicate',
      icon: <Copy width={16} />,
      showTooltip: false,
    },
    {
      label: 'Query permission',
      value: 'permission',
      icon: (
        <img
          alt="permission-icon"
          src="assets/images/icons/editor/left-sidebar/authorization.svg"
          width="16"
          height="16"
        />
      ),
      trailingIcon: !licenseValid ? <SolidIcon width={16} name="enterprisecrown" className="mx-1" /> : undefined,
      tooltipText: 'Query permissions are available only in paid plans',
      showTooltip: !licenseValid,
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: <Trash width={16} fill={'#E54D2E'} />,
      showTooltip: false,
    },
  ];

  const handleQueryMenuActions = (value) => {
    if (value === 'rename') {
      setRenamingQuery(true);
    }
    if (value === 'duplicate') {
      debouncedDuplicateQuery(dataQuery?.id, appId);
    }
    if (value === 'permission') {
      if (!licenseValid) return;
      toggleQueryPermissionModal(true);
    }
    if (value === 'delete') {
      deleteDataQuery();
    }
    setShowQueryMenu(false);
  };

  const [renamingQuery, setRenamingQuery] = useState(false);

  const deleteDataQuery = () => {
    setShowDeleteConfirmation(true);
  };

  const updateQueryName = (dataQuery, newName) => {
    const { name } = dataQuery;
    if (name === newName) {
      return setRenamingQuery(false);
    }
    const isNewQueryNameAlreadyExists = checkExistingQueryName(newName);
    if (newName && !isNewQueryNameAlreadyExists) {
      renameQuery(dataQuery?.id, newName);
      setRenamingQuery(false);
      updateQuerySuggestions(name, newName);
    } else {
      if (isNewQueryNameAlreadyExists) {
        toast.error('Query name already exists');
      }
      setRenamingQuery(false);
    }
  };

  const executeDataQueryDeletion = () => {
    setShowDeleteConfirmation(false);
    deleteDataQueries(dataQuery?.id);
    setPreviewData(null);
  };

  // To prevent user clicking from continuous clicks
  const debouncedDuplicateQuery = useCallback(
    debounce((queryId, appId) => {
      duplicateQuery(queryId, appId);
      setPreviewData(null);
    }, 500),
    [duplicateQuery]
  );

  return (
    <>
      <div
        className={`row query-row pe-2 ${darkMode && 'dark-theme'}` + (isQuerySelected ? ' query-row-selected' : '')}
        key={dataQuery.id}
        onClick={() => {
          if (isQuerySelected) return;
          setSelectedQuery(dataQuery?.id);
          setPreviewData(null);
        }}
        role="button"
      >
        <div className="col-auto query-icon d-flex">
          <DataSourceIcon source={dataQuery} height={16} />
        </div>
        <div className="col query-row-query-name">
          {renamingQuery ? (
            <input
              data-cy={`query-edit-input-field`}
              className={`query-name query-name-input-field border-indigo-09 bg-transparent  ${
                darkMode && 'text-white'
              }`}
              type="text"
              defaultValue={decodeEntities(dataQuery.name)}
              autoFocus={true}
              onKeyDown={({ target, key }) => {
                if (key === 'Enter') {
                  updateQueryName(dataQuery, target.value);
                }
              }}
              onBlur={({ target }) => {
                updateQueryName(dataQuery, target.value);
              }}
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
              </span>{' '}
              {!isQueryRunnable(dataQuery) && <small className="mx-2 text-secondary">Draft</small>}
              {localDs && (
                <>
                  <a
                    className="text-truncate"
                    data-tooltip-id="query-card-local-ds-info"
                    href="https://docs.tooljet.com/docs/data-sources/overview/#changing-scope-of-data-sources-on-an-app-created-on-older-versions-of-tooljet"
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
        <div className={`col-auto query-rename-delete-btn ${!shouldFreeze && isQuerySelected ? 'd-flex' : 'd-none'}`}>
          <OverlayTrigger
            trigger={'click'}
            placement={'bottom-start'}
            rootClose
            onHide={() => setShowQueryMenu(false)}
            show={showQueryMenu && isQuerySelected}
            popperConfig={{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 3],
                  },
                },
              ],
            }}
            overlay={
              <Popover id="list-menu" className={darkMode && 'dark-theme'}>
                <Popover.Body bsPrefix="list-item-popover-body">
                  {QUERY_MENU_OPTIONS.map((option) => (
                    <ToolTip
                      key={option?.value}
                      message={option?.tooltipText}
                      placement="right"
                      show={option?.showTooltip}
                    >
                      <div
                        data-cy={`query-menu-${String(option?.value).toLowerCase()}-button`}
                        className="list-item-popover-option"
                        key={option?.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQueryMenuActions(option.value);
                        }}
                      >
                        <div className="list-item-popover-menu-option-icon">{option.icon}</div>
                        <div
                          className={classNames('list-item-option-menu-label', {
                            'color-tomato9': option.value === 'delete',
                          })}
                        >
                          {option?.label}
                        </div>
                        {option.trailingIcon && option.trailingIcon}
                      </div>
                    </ToolTip>
                  ))}
                </Popover.Body>
              </Popover>
            }
          >
            <ButtonComponent
              iconOnly
              leadingIcon="morevertical01"
              onClick={() => setShowQueryMenu(!showQueryMenu)}
              size="small"
              variant="outline"
              className=""
            />
          </OverlayTrigger>
        </div>
      </div>
      <Confirm
        show={showDeleteConfirmation}
        message={'Do you really want to delete this query?'}
        confirmButtonLoading={isDeletingQueryInProcess}
        onConfirm={executeDataQueryDeletion}
        onCancel={() => setShowDeleteConfirmation(false)}
        darkMode={darkMode}
      />
    </>
  );
};
