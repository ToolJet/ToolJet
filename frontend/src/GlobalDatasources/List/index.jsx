import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { GlobalDataSourcesContext } from '..';
import Skeleton from 'react-loading-skeleton';
import { ListItem } from '../LIstItem';
import { ConfirmDialog } from '@/_components';
import { globalDatasourceService } from '@/_services';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { SearchBox } from '@/_components/SearchBox';

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

  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    fetchDataSources(false).catch(() => {
      toast.error('Failed to fetch datasources');
      return;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFilteredData([...dataSources]);
  }, [dataSources]);

  const deleteDataSource = (selectedSource) => {
    setActiveDatasourceList('');
    setSelectedDataSource(selectedSource);
    setCurrentEnvironment(environments[0]);
    toggleDataSourceManagerModal(true);
    updateSelectedDatasource(selectedSource?.name);
    setDeleteModalVisibility(true);
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
        <div className="tj-text-md text-secondary">No datasources added</div>
      </div>
    );
  };

  return (
    <>
      <div style={{ overflow: 'hidden' }}>
        <div className="w-100 datasource-inner-sidebar-wrap" data-cy="datasource-Label">
          {isLoading ? (
            <Skeleton containerClassName="datasource-loader" count={3} height={30} />
          ) : (
            <>
              <div className="d-flex justify-content-between datasources-search" style={{ marginBottom: '8px' }}>
                {!showInput ? (
                  <>
                    <div className="datasources-info tj-text-xsm">
                      Data Sources Added{' '}
                      {!isLoading && filteredData && filteredData.length > 0 && `(${filteredData.length})`}
                    </div>
                    <div
                      className="datasources-search-btn"
                      onClick={() => {
                        setShowInput(true);
                      }}
                    >
                      <SolidIcon name="search" width="14" fill={darkMode ? '#ECEDEE' : '#11181C'} />
                    </div>
                  </>
                ) : (
                  <SearchBox
                    width="248px"
                    callBack={handleSearch}
                    placeholder={'Search for Data Sources'}
                    customClass="tj-common-search-input"
                    onClearCallback={handleClose}
                    autoFocus={true}
                  />
                )}
              </div>
              {!isLoading && filteredData?.length ? (
                <div className="list-group">
                  {filteredData?.map((source, idx) => {
                    return (
                      <ListItem
                        dataSource={source}
                        key={idx}
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
