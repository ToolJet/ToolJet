import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { GlobalDataSourcesContext } from '../../pages/GlobalDataSourcesPage';
import { ListItem } from '../LIstItem';
import { ConfirmDialog } from '@/_components';
import { globalDatasourceService } from '@/_services';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { SearchBox } from '@/_components/SearchBox';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import FolderSkeleton from '@/_ui/FolderSkeleton/FolderSkeleton';
import Modal from '@/HomePage/Modal';

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
  } = useContext(GlobalDataSourcesContext);

  const [isDeletingDatasource, setDeletingDatasource] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisibility] = React.useState(false);
  const [filteredData, setFilteredData] = useState(dataSources);
  const [showInput, setShowInput] = useState(false);
  const [showDependentQueriesInfo, setShowDependentQueriesInfo] = useState(false);

  const darkMode = localStorage.getItem('darkMode') === 'true';

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

  const deleteDataSource = (selectedSource) => {
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
    const value = e?.target?.value;
    const filtered = dataSources.filter((item) => item?.name?.toLowerCase().includes(value?.toLowerCase()));
    setFilteredData(filtered);
  };

  function handleClose() {
    setShowInput(false);
    setFilteredData(dataSources);
  }

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
                    <div
                      className="datasources-search-btn"
                      onClick={() => {
                        setShowInput(true);
                      }}
                      data-cy="added-ds-search-icon"
                    >
                      <SolidIcon name="search" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
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

              {!isLoading && filteredData?.length ? (
                <div className="list-group">
                  {filteredData?.map((source, idx) => {
                    const sanpleDBtoolTipText =
                      source.type == DATA_SOURCE_TYPE.SAMPLE ? 'Sample data source\ncannot be deleted' : '';
                    return (
                      <ListItem
                        dataSource={source}
                        key={idx}
                        toolTipText={sanpleDBtoolTipText}
                        active={selectedDataSource?.id === source?.id}
                        onDelete={deleteDataSource}
                        updateSelectedDatasource={updateSelectedDatasource}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </div>
      </div>
      <Modal
        title="Dependent queries"
        show={showDependentQueriesInfo}
        closeModal={() => setShowDependentQueriesInfo(false)}
      >
        <div className="mt-3 mb-3">
          Cannot delete the <b>{selectedDataSource?.name ? selectedDataSource.name : 'datasource'}</b> as it is used in
          the apps
        </div>
      </Modal>
      <ConfirmDialog
        show={isDeleteModalVisible}
        message={'You will lose all the queries created from this data source. Do you really want to delete?'}
        confirmButtonLoading={isDeletingDatasource}
        onConfirm={() => executeDataSourceDeletion()}
        onCancel={() => cancelDeleteDataSource()}
        darkMode={darkMode}
        backdropClassName="delete-modal"
      />
    </>
  );
};
