import React, { useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { DndContext, DragOverlay, pointerWithin, useSensor, useSensors } from '@dnd-kit/core';
import { CustomPointerSensor } from '@/_ui/SortableTree';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';
import { ListItem } from '../LIstItem';
import { DraggableDataSource, DroppableZone } from '../DataSourceFolders/dnd';
import { ConfirmDialog, ToolTip } from '@/_components';
import { globalDatasourceService } from '@/_services';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { SearchBox } from '@/_components/SearchBox';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import FolderSkeleton from '@/_ui/FolderSkeleton/FolderSkeleton';
import Modal from '@/HomePage/Modal';
import { Button } from '@/components/ui/Button/Button';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { WorkspaceSwitchBranchModal } from '@/_ui/WorkspaceBranchDropdown/SwitchBranchModal';
import { DataSourceFolders } from '../DataSourceFolders';
import { FolderFormModal } from '../DataSourceFolders/FolderFormModal';
import { MoveDataSourceModal } from '../DataSourceFolders/MoveDataSourceModal';

export const List = ({ updateSelectedDatasource }) => {
  const {
    dataSources,
    fetchDataSources,
    selectedDataSource,
    setSelectedDataSource,
    toggleDataSourceManagerModal,
    isLoading,
    environments,
    setCurrentEnvironment,
    setActiveDatasourceList,
    setLoading,
    folders,
    createDataSourceFolder,
    renameDataSourceFolder,
    deleteDataSourceFolder,
    addDataSourcesToFolder,
    removeDataSourcesFromFolder,
    expandFolder,
    selectedDataSourceIds,
    setSelectedDataSourceIds,
    canCreateDataSourceFolder,
  } = useContext(GlobalDataSourcesContext);

  const [isDeletingDatasource, setDeletingDatasource] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisibility] = React.useState(false);
  const [filteredData, setFilteredData] = useState(dataSources);
  const [showInput, setShowInput] = useState(false);
  const [showDependentQueriesInfo, setShowDependentQueriesInfo] = useState(false);
  const [showSwitchBranchModal, setShowSwitchBranchModal] = useState(false);
  const [pendingDeleteSource, setPendingDeleteSource] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  // Folder create/rename modal (create from the "+" header button, rename from a folder's menu).
  const [folderModal, setFolderModal] = useState({ show: false, mode: 'create', folder: null });
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [movingDataSource, setMovingDataSource] = useState(null);
  const [activeDragDataSource, setActiveDragDataSource] = useState(null);
  const pendingDeleteAfterSwitchRef = useRef(null);

  // Drag only starts past 8px of movement (and only from a [data-draggable] row), so clicking a
  // data source to open it, or its delete button, still works.
  const dndSensors = useSensors(useSensor(CustomPointerSensor, { activationConstraint: { distance: 8 } }));

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const searchActive = searchValue.trim().length > 0;

  // Data sources already placed in a folder are rendered inside their folder, not in the stray
  // list. Stray = the (search-filtered) data sources belonging to no folder, kept alphabetical.
  const folderedDataSourceIds = React.useMemo(() => {
    const ids = new Set();
    (folders ?? []).forEach((folder) =>
      (folder.folder_data_sources ?? []).forEach((membership) => ids.add(membership.data_source_id))
    );
    return ids;
  }, [folders]);

  const strayDataSources = filteredData.filter((ds) => !folderedDataSourceIds.has(ds.id));
  const hasSidebarContent = (folders?.length ?? 0) > 0 || strayDataSources.length > 0;

  const isBranchingEnabled = useWorkspaceBranchesStore((state) => {
    if (!state.isInitialized || !state.orgGitConfig) return false;
    return !!(state.orgGitConfig?.is_branching_enabled || state.orgGitConfig?.isBranchingEnabled);
  });

  const isOnDefaultBranch = useWorkspaceBranchesStore((state) => {
    return !!(state.currentBranch?.is_default || state.currentBranch?.isDefault);
  });

  useEffect(() => {
    environments?.length &&
      fetchDataSources(false).catch(() => {
        toast.error('Failed to fetch datasources');
        return;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environments]);

  useEffect(() => {
    setFilteredData([...dataSources]);
  }, [dataSources]);

  // After branch switch + refetch, trigger the deferred delete flow
  useEffect(() => {
    if (pendingDeleteAfterSwitchRef.current && !isLoading && dataSources.length) {
      const source = pendingDeleteAfterSwitchRef.current;
      pendingDeleteAfterSwitchRef.current = null;
      deleteDataSource(source);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSources, isLoading]);

  const deleteDataSource = (selectedSource) => {
    const isDsUnsynced = selectedSource?.is_synced === false || selectedSource?.isSynced === false;
    if (isBranchingEnabled && isOnDefaultBranch && !isDsUnsynced) {
      setPendingDeleteSource(selectedSource);
      setShowSwitchBranchModal(true);
      return;
    }
    setActiveDatasourceList('');
    setSelectedDataSource(selectedSource);
    setCurrentEnvironment(environments[0]);
    toggleDataSourceManagerModal(true);
    updateSelectedDatasource(selectedSource?.name);
    getQueriesLinkedToDatasource(selectedSource);
  };

  const executeDataSourceDeletion = () => {
    setDeletingDatasource(true);
    setLoading(true);
    globalDatasourceService
      .deleteDataSource(selectedDataSource.id)
      .then(() => {
        setDeleteModalVisibility(false);
        toast.success('Data Source Deleted');
        setDeletingDatasource(false);
        setSelectedDataSource(null);
        fetchDataSources(true);
      })
      .catch(({ error }) => {
        setDeleteModalVisibility(false);
        setDeletingDatasource(false);
        setSelectedDataSource(null);
        setLoading(false);
        toast.error(error);
      });
  };

  const getQueriesLinkedToDatasource = (selectedSource) => {
    globalDatasourceService
      .getQueriesLinkedToDatasource(selectedSource.id)
      .then((data) => {
        if (data?.dependent_queries) {
          setShowDependentQueriesInfo(true);
        } else {
          setDeleteModalVisibility(true);
        }
      })
      .catch(({ error }) => {
        toast.error(error);
      });
  };

  const cancelDeleteDataSource = () => {
    setDeleteModalVisibility(false);
  };

  const handleSearch = (e) => {
    const value = e?.target?.value ?? '';
    setSearchValue(value);
    const filtered = dataSources.filter((item) => item?.name?.toLowerCase().includes(value?.toLowerCase()));
    setFilteredData(filtered);
  };

  function handleClose() {
    setShowInput(false);
    setSearchValue('');
    setFilteredData(dataSources);
  }

  const handleDragStart = ({ active }) => {
    setActiveDragDataSource(active?.data?.current?.dataSource ?? null);
  };

  // The ids that actually move on drop: the whole multi-selection when the dragged row is part of
  // it, otherwise just the dragged row (dragging an unselected row ignores the selection).
  const getDraggedIds = (draggedId) =>
    selectedDataSourceIds.length > 1 && selectedDataSourceIds.includes(draggedId) ? selectedDataSourceIds : [draggedId];

  // Drop semantics (no ordering): onto a folder → add/move there; onto the stray zone → remove
  // from its current folder. Dropping onto the same folder, or stray rows onto the stray zone,
  // is a no-op.
  const handleDragEnd = ({ active, over }) => {
    setActiveDragDataSource(null);
    if (!over) return;
    const dataSourceId = active?.data?.current?.dataSource?.id;
    const sourceFolderId = active?.data?.current?.sourceFolderId ?? null;
    const targetFolderId = over?.data?.current?.folderId ?? null;
    if (!dataSourceId) return;

    const ids = getDraggedIds(dataSourceId);

    if (targetFolderId) {
      // A single dragged row already in the target folder is a no-op; for a multi-drag the backend
      // idempotently skips ones already there and moves the rest.
      if (ids.length === 1 && targetFolderId === sourceFolderId) return;
      // Open the destination folder so the dropped data source(s) are immediately visible.
      expandFolder(targetFolderId);
      addDataSourcesToFolder(ids, targetFolderId)
        .then(() => setSelectedDataSourceIds([]))
        .catch(({ error }) => toast.error(error || 'Could not move data source to folder'));
    } else {
      removeDataSourcesFromFolder(ids)
        .then(() => setSelectedDataSourceIds([]))
        .catch(({ error }) => toast.error(error || 'Could not remove data source from folder'));
    }
  };

  // Count shown on the drag chip: the selection size when dragging a multi-selection, else 1.
  const dragCount =
    activeDragDataSource && selectedDataSourceIds.includes(activeDragDataSource.id) && selectedDataSourceIds.length > 1
      ? selectedDataSourceIds.length
      : 1;

  const executeFolderDeletion = () => {
    setIsDeletingFolder(true);
    deleteDataSourceFolder(deletingFolder.id)
      .then(() => {
        toast.success('Folder deleted successfully!');
        setIsDeletingFolder(false);
        setDeletingFolder(null);
      })
      .catch(({ error }) => {
        setIsDeletingFolder(false);
        setDeletingFolder(null);
        toast.error(error || 'Could not delete folder');
      });
  };

  const EmptyState = () => {
    return (
      <div
        style={{
          transform: 'translateY(80%)',
        }}
        className="d-flex justify-content-center align-items-center flex-column mt-3"
      >
        <div className="mb-4">
          <EmptyFoldersIllustration />
        </div>
        <div className="tj-text-md text-secondary" data-cy="empty-ds-page-text">
          {filteredData?.length === 0 && dataSources?.length !== 0 ? 'No results found' : 'No datasources added'}
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ overflow: 'hidden' }}>
        <div className="w-100 datasource-inner-sidebar-wrap" data-cy="datasource-Label">
          {isLoading ? (
            <div className="p-2">
              <FolderSkeleton />
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between datasources-search" style={{ marginBottom: '8px' }}>
                {!showInput ? (
                  <>
                    <div className="datasources-info tj-text-xsm" data-cy="added-ds-label">
                      Data sources added{' '}
                      {!isLoading && filteredData && filteredData.length > 0 && `(${filteredData.length})`}
                    </div>
                    <div className="d-flex align-items-center" style={{ gap: '4px' }}>
                      {canCreateDataSourceFolder() && (
                        <ToolTip message="Create folder" placement="top">
                          <Button
                            size="medium"
                            variant="ghost"
                            iconOnly
                            ariaLabel="Create folder"
                            onClick={() => setFolderModal({ show: true, mode: 'create', folder: null })}
                            data-cy="create-datasource-folder-icon"
                          >
                            <SolidIcon name="plus" width="14" fill={darkMode ? '#CFD3D8E6' : '#6A727C'} />
                          </Button>
                        </ToolTip>
                      )}
                      <Button
                        size="medium"
                        variant="ghost"
                        iconOnly
                        ariaLabel="Search for folders"
                        onClick={() => {
                          setShowInput(true);
                        }}
                        data-cy="added-ds-search-icon"
                      >
                        <SolidIcon name="search" width="14" fill={darkMode ? '#CFD3D8E6' : '#6A727C'} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <SearchBox
                    width="248px"
                    callBack={handleSearch}
                    placeholder={'Search for Data sources'}
                    customClass="tj-common-search-input"
                    onClearCallback={handleClose}
                    autoFocus={true}
                    dataCy={'added-ds'}
                  />
                )}
              </div>

              {!isLoading && hasSidebarContent ? (
                <DndContext
                  sensors={dndSensors}
                  collisionDetection={pointerWithin}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setActiveDragDataSource(null)}
                >
                  <div className="list-group">
                    {/* Folders first (alphabetical), each with its data sources nested inside. */}
                    <DataSourceFolders
                      visibleDataSources={filteredData}
                      searchActive={searchActive}
                      onDeleteDataSource={deleteDataSource}
                      updateSelectedDatasource={updateSelectedDatasource}
                      onRenameFolder={(folder) => setFolderModal({ show: true, mode: 'rename', folder })}
                      onDeleteFolder={(folder) => setDeletingFolder(folder)}
                      onMoveDataSource={(ds) => setMovingDataSource(ds)}
                      darkMode={darkMode}
                    />
                    {/* Stray (unfoldered) data sources below the folders, alphabetical. Dropping a
                        foldered data source here removes it from its folder. */}
                    <DroppableZone id="stray-zone" data={{ folderId: null }} className="datasource-stray-zone">
                      {strayDataSources.map((source, idx) => {
                        const sanpleDBtoolTipText =
                          source.type == DATA_SOURCE_TYPE.SAMPLE ? 'Sample data source\ncannot be deleted' : '';
                        return (
                          <DraggableDataSource key={source.id ?? idx} dataSource={source} sourceFolderId={null}>
                            <ListItem
                              dataSource={source}
                              toolTipText={sanpleDBtoolTipText}
                              active={selectedDataSource?.id === source?.id}
                              onDelete={deleteDataSource}
                              updateSelectedDatasource={updateSelectedDatasource}
                            />
                          </DraggableDataSource>
                        );
                      })}
                    </DroppableZone>
                  </div>
                  <DragOverlay dropAnimation={null}>
                    {activeDragDataSource ? (
                      <div className="datasource-drag-overlay">
                        {dragCount > 1 ? `${dragCount} data sources` : activeDragDataSource.name}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </div>
      </div>
      <Modal
        title="Dependent queries found!"
        show={showDependentQueriesInfo}
        closeModal={() => setShowDependentQueriesInfo(false)}
      >
        <div className="mt-3 mb-3">
          Cannot delete <b>{selectedDataSource?.name ? selectedDataSource.name : 'datasource'}</b> as it is used in the
          apps
        </div>
      </Modal>
      <ConfirmDialog
        show={isDeleteModalVisible}
        title={isBranchingEnabled ? 'Delete datasource' : undefined}
        message={
          isBranchingEnabled
            ? "Deleting this data source will only apply changes to the selected branch. To reflect these changes on master, you'll need to push and commit your changes, then merge them."
            : 'Do you want to delete?'
        }
        confirmButtonText={isBranchingEnabled ? 'Delete' : undefined}
        confirmButtonLoading={isDeletingDatasource}
        onConfirm={() => executeDataSourceDeletion()}
        onCancel={() => cancelDeleteDataSource()}
        darkMode={darkMode}
        backdropClassName="delete-modal"
      />
      {showSwitchBranchModal && (
        <WorkspaceSwitchBranchModal
          show={showSwitchBranchModal}
          onClose={() => {
            setShowSwitchBranchModal(false);
            setPendingDeleteSource(null);
          }}
          onBranchSwitch={() => {
            if (pendingDeleteSource) {
              pendingDeleteAfterSwitchRef.current = pendingDeleteSource;
              setPendingDeleteSource(null);
            }
            setShowSwitchBranchModal(false);
          }}
        />
      )}
      <FolderFormModal
        show={folderModal.show}
        mode={folderModal.mode}
        folder={folderModal.folder}
        onClose={() => setFolderModal((prev) => ({ ...prev, show: false }))}
        onCreate={createDataSourceFolder}
        onRename={renameDataSourceFolder}
      />
      <MoveDataSourceModal
        show={!!movingDataSource}
        initialDataSource={movingDataSource}
        dataSources={dataSources}
        folders={folders}
        onClose={() => setMovingDataSource(null)}
        onSubmit={(dsIds, folderId) => {
          // Open the destination folder so the moved data source(s) show immediately.
          expandFolder(folderId);
          return addDataSourcesToFolder(dsIds, folderId);
        }}
      />
      <ConfirmDialog
        show={!!deletingFolder}
        title={`Delete ${deletingFolder?.name ?? ''}`}
        message="Deleting this folder will only delete the folder and not the data sources in it. This action is irreversible. Are you sure you want to continue?"
        confirmButtonText="Delete"
        confirmButtonLoading={isDeletingFolder}
        onConfirm={executeFolderDeletion}
        onCancel={() => setDeletingFolder(null)}
        darkMode={darkMode}
      />
    </>
  );
};
