import React, { useContext, useState } from 'react';
import cx from 'classnames';
import { useNavigate } from 'react-router-dom';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';
import { DataSourceTypes } from '../../../common/components/DataSourceComponents';
import { getSvgIcon } from '@/_helpers/appUtils';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { decodeEntities, getWorkspaceId } from '@/_helpers/utils';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { PushAppsModal } from '@ee/modules/Appbuilder/components/GitSyncManager/PushAppsModal';

const DUMMY_DS_LABEL = 'Undefined data source';
const buildDummyDsTooltip = (coRelationId) =>
  coRelationId
    ? `Data source #${coRelationId} is missing, pull from git to resolve this`
    : 'Data source is missing, pull from git to resolve this';

export const ListItem = ({
  dataSource,
  key,
  active,
  onDelete,
  updateSelectedDatasource,
  toolTipText,
  disableDelButton = false,
}) => {
  const {
    setSelectedDataSource,
    toggleDataSourceManagerModal,
    environments,
    setCurrentEnvironment,
    setActiveDatasourceList,
    canDeleteDataSource,
  } = useContext(GlobalDataSourcesContext);
  const { handleActions } = useGlobalDatasourceUnsavedChanges();
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId();
  const [syncIconHovered, setSyncIconHovered] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const wsCurrentBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  const isSampleDb = dataSource.type == DATA_SOURCE_TYPE.SAMPLE;
  const isOnDefaultBranch = !!(wsCurrentBranch?.is_default || wsCurrentBranch?.isDefault);
  const isUnsynced =
    wsCurrentBranch && isOnDefaultBranch && (dataSource?.is_synced === false || dataSource?.isSynced === false);

  const getSourceMetaData = (dataSource) => {
    if (dataSource.pluginId) {
      return dataSource.plugin?.manifestFile?.data.source;
    }

    return DataSourceTypes.find((source) => source?.kind === dataSource?.kind);
  };

  const sourceMeta = getSourceMetaData(dataSource);

  // sourceMeta would be missing on development setup when switching between branches
  // if ds is already in branch while not available in another
  const icon =
    dataSource.type === DATA_SOURCE_TYPE.SAMPLE ? (
      <img src="assets/images/tj-logo.svg" style={{ padding: '0px' }} />
    ) : (
      getSvgIcon(sourceMeta?.kind?.toLowerCase(), 24, 24, dataSource?.plugin?.iconFile?.data)
    );

  const focusModal = () => {
    const element = document.getElementsByClassName('form-control-plaintext form-control-plaintext-sm')[0];
    element?.focus();
  };

  const selectDataSource = () => {
    setActiveDatasourceList('');
    setSelectedDataSource(dataSource);
    setCurrentEnvironment(environments[0]);
    toggleDataSourceManagerModal(true);
    focusModal();
    updateSelectedDatasource(dataSource?.name);
    navigate(`/${workspaceId}/data-sources/${dataSource.id}`, { replace: true });
  };

  //const isSampleDb = dataSource.type == DATA_SOURCE_TYPE.SAMPLE;
  const showDeleteButton = !isSampleDb && canDeleteDataSource();

  return (
    <>
    <ToolTip
      placement="right"
      show={toolTipText ? true : false}
      message={'Sample data source\ncannot be deleted'}
      tooltipClassName="tooltip-sampl-db"
    >
      <div
        key={key}
        className={cx('mx-3 rounded-3 datasources-list', {
          'datasources-list-item': active,
        })}
        onMouseEnter={() => setRowHovered(true)}
        onMouseLeave={() => setRowHovered(false)}
      >
        <div
          role="button"
          onClick={() => handleActions(selectDataSource)}
          className="col d-flex align-items-center overflow-hidden"
          data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-button`}
        >
          <div className="ds-svg-container">{icon}</div>

          <div
            className="font-400 tj-text-xsm text-truncate tw-flex tw-items-center tw-gap-1"
            style={{ paddingLeft: '6px' }}
          >
            {dataSource.is_dummy ? DUMMY_DS_LABEL : decodeEntities(dataSource.name)}
            {dataSource.is_dummy && (
              <ToolTip placement="right" message={buildDummyDsTooltip(dataSource.co_relation_id)}>
                <span className="tw-inline-flex tw-items-center" data-cy="dummy-ds-warning-icon">
                  <SolidIcon name="warning" width="14" fill="var(--icon-warning)" />
                </span>
              </ToolTip>
            )}
            {isSampleDb && (
              <div
                className="font-400 tj-text-xxsm text-truncate"
                style={{ paddingTop: '3px', paddingLeft: '2px', color: '#687076' }}
              >{`(postgres)`}</div>
            )}
          </div>
        </div>
        {/* On hover: refresh icon appears to the left of the delete button */}
        {isUnsynced && rowHovered && (
          <div className="col-auto">
            <ToolTip message="Click to push datasource to git" placement="top">
              <div
                onMouseEnter={() => setSyncIconHovered(true)}
                onMouseLeave={() => setSyncIconHovered(false)}
                onClick={() => setPushModalOpen(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  backgroundColor: syncIconHovered ? '#FFEEF0' : 'transparent',
                  transition: 'background-color 0.15s',
                  cursor: 'pointer',
                }}
                data-cy="ds-unsynced-badge"
              >
                <SolidIcon name="refresh" width="14" fill="#E54D2E" />
              </div>
            </ToolTip>
          </div>
        )}
        {/* Right slot: refresh icon when not hovering (unsynced), delete button when hovering */}
        {isUnsynced && !rowHovered ? (
          <div className="col-auto">
            <ToolTip message="Datasource not synced in remote git" placement="top">
              <div
                onClick={() => setPushModalOpen(true)}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                data-cy="ds-unsynced-badge-idle"
              >
                <SolidIcon name="refresh" width="14" fill="#E54D2E" />
              </div>
            </ToolTip>
          </div>
        ) : (
          showDeleteButton && (
            <div className="col-auto">
              <button
                title={'Delete'}
                disabled={disableDelButton}
                className="ds-delete-btn"
                onClick={() => onDelete(dataSource)}
                data-cy={`${String(dataSource.name).toLowerCase().replace(/\s+/g, '-')}-delete-button`}
              >
                <div>
                  <SolidIcon
                    width="14"
                    height="14"
                    name="delete"
                    fill={disableDelButton ? '#E6E8EB' : '#E54D2E'}
                    className={disableDelButton ? 'disabled-button' : ''}
                  />
                </div>
              </button>
            </div>
          )
        )}
      </div>
    </ToolTip>
    {PushAppsModal && isUnsynced && (
      <PushAppsModal
        show={pushModalOpen}
        onClose={() => setPushModalOpen(false)}
        resourceType="datasource"
        resourceName={dataSource.name}
        onSuccess={() => setPushModalOpen(false)}
      />
    )}
    </>
  );
};
