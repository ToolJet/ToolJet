import React, { useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { GlobalDataSourcesContext } from '..';
import Skeleton from 'react-loading-skeleton';
import { ListItem } from '../LIstItem';
import { ConfirmDialog } from '@/_components';
import { globalDatasourceService } from '@/_services';

export const List = (props) => {
  const { dataSources, fetchDataSources, selectedDataSource, setSelectedDataSource, toggleDataSourceManagerModal } =
    useContext(GlobalDataSourcesContext);

  const [loading, setLoading] = useState(true);
  const [isDeletingDatasource, setDeletingDatasource] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisibility] = React.useState(false);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    fetchDataSources()
      .then(() => {
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        toast.error('Failed to fetch datasources');
        return;
      });
  }, []);

  const deleteDataSource = (selectedSource) => {
    toggleDataSourceManagerModal(false);
    setSelectedDataSource(selectedSource);
    setDeleteModalVisibility(true);
  };

  const executeDataSourceDeletion = () => {
    setDeleteModalVisibility(false);
    setDeletingDatasource(true);
    globalDatasourceService
      .deleteDataSource(selectedDataSource.id)
      .then(() => {
        toast.success('Data Source Deleted');
        setDeletingDatasource(false);
        setSelectedDataSource(null);
        fetchDataSources(true);
      })
      .catch(({ error }) => {
        setDeletingDatasource(false);
        setSelectedDataSource(null);
        toast.error(error);
      });
  };

  const cancelDeleteDataSource = () => {
    setDeleteModalVisibility(false);
    setSelectedDataSource(null);
  };

  return (
    <>
      <div className="list-group mb-3">
        {loading && <Skeleton count={3} height={22} />}
        {!loading && (
          <div className="mt-2 w-100" data-cy="datasource-Label">
            {dataSources?.map((source, idx) => (
              <ListItem
                dataSource={source}
                key={idx}
                active={selectedDataSource?.id === source?.id}
                onDelete={deleteDataSource}
              />
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        show={isDeleteModalVisible}
        message={'You will lose all the queries created from this data source. Do you really want to delete?'}
        confirmButtonLoading={isDeletingDatasource}
        onConfirm={() => executeDataSourceDeletion()}
        onCancel={() => cancelDeleteDataSource()}
        darkMode={darkMode}
      />
    </>
  );
};
