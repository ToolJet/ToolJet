import React, { useState, useContext, useEffect } from 'react';
import cx from 'classnames';
import Table from '../Table';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import CreateRowDrawer from '../Drawers/CreateRowDrawer';
import EditRowDrawer from '../Drawers/EditRowDrawer';
import BulkUploadDrawer from '../Drawers/BulkUploadDrawer';
import Filter from '../Filter';
import Sort from '../Sort';
import Sidebar from '../Sidebar';
import { TooljetDatabaseContext } from '../index';
import EmptyFoldersIllustration from '@assets/images/icons/no-queries-added.svg';
import { toast } from 'react-hot-toast';
import { isEmpty } from 'lodash';
import { tooljetDatabaseService } from '@/_services';

const TooljetDatabasePage = ({ totalTables }) => {
  const {
    columns,
    selectedTable,
    handleBuildSortQuery,
    handleBuildFilterQuery,
    resetFilterQuery,
    resetSortQuery,
    queryFilters,
    setQueryFilters,
    sortFilters,
    setSortFilters,
    organizationId,
    setTotalRecords,
    setSelectedTableData,
  } = useContext(TooljetDatabaseContext);

  const [isCreateRowDrawerOpen, setIsCreateRowDrawerOpen] = useState(false);
  const [isBulkUploadDrawerOpen, setIsBulkUploadDrawerOpen] = useState(false);
  const [isEditRowDrawerOpen, setIsEditRowDrawerOpen] = useState(false);
  const [isCreateColumnDrawerOpen, setIsCreateColumnDrawerOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [errors, setErrors] = useState({ client: [], server: [] });
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    setErrors({ client: [], server: [] });
    handleFileValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkUploadFile]);

  useEffect(() => {
    if (!isBulkUploadDrawerOpen) {
      setErrors({ client: [], server: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBulkUploadDrawerOpen]);

  useEffect(() => {
    const reloadTableData = async () => {
      const { headers, data, error } = await tooljetDatabaseService.findOne(organizationId, selectedTable.id);

      if (error) {
        toast.error(error?.message ?? 'Something went wrong');
        return;
      }
      const totalRecords = headers['content-range'].split('/')[1] || 0;

      if (Array.isArray(data)) {
        setTotalRecords(totalRecords);
        setSelectedTableData(data);
      }
    };

    setIsBulkUploading(false);
    setBulkUploadFile(null);
    setIsBulkUploadDrawerOpen(false);
    reloadTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult]);

  const EmptyState = () => {
    return (
      <div
        style={{
          transform: 'translateY(50%)',
        }}
        className="d-flex justify-content-center align-items-center flex-column mt-3"
      >
        <div className="mb-4">
          <EmptyFoldersIllustration />
        </div>
        <div className="text-center">
          <div className="text-h3" data-cy="do-not-have-table-text">
            You don&apos;t have any tables yet.
          </div>
        </div>
        <div className="text-h5 text-secondary" data-cy="create-table-to-get-started-text">
          Create a table to get started!
        </div>
      </div>
    );
  };

  const handleFileValidation = () => {
    const fileValidationErrors = [];

    if (bulkUploadFile && bulkUploadFile.size / 1024 > 2 * 1024) {
      fileValidationErrors.push('File size cannot exceed 2mb');
    }

    setErrors({ server: [], client: fileValidationErrors });
  };

  const handleBulkUpload = async (event) => {
    event.preventDefault();
    setErrors({ client: [], server: [] });
    setIsBulkUploading(true);

    const formData = new FormData();
    formData.append('file', bulkUploadFile);
    try {
      const { error, data } = await tooljetDatabaseService.bulkUpload(
        organizationId,
        selectedTable.table_name,
        formData
      );

      if (error) {
        setErrors({ ...errors, ...{ server: error.message } });
        setIsBulkUploading(false);
        toast.error('Upload failed!', { position: 'top-center' });
        return;
      }

      const { processed_rows: processedRows, rows_inserted: rowsInserted, rows_updated: rowsUpdated } = data.result;

      toast.success(`${processedRows} successfully uploaded!`, {
        position: 'top-center',
      });

      setUploadResult({ processedRows, rowsInserted, rowsUpdated });
    } catch (error) {
      toast.error(error.errors, { position: 'top-center' });
      setIsBulkUploading(false);
    }
  };

  const handleBulkUploadFileChange = (file) => {
    setBulkUploadFile(file);
  };

  return (
    <div className="row gx-0">
      <Sidebar />
      <div className={cx('col animation-fade database-page-content-wrap')}>
        {totalTables === 0 && <EmptyState />}
        {!isEmpty(selectedTable) && (
          <>
            <div className="database-table-header-wrapper">
              <div className="card border-0">
                <div className="card-body  tj-db-operations-header">
                  <div className="row align-items-center">
                    <div className="col align-items-center p-3">
                      <CreateColumnDrawer
                        isCreateColumnDrawerOpen={isCreateColumnDrawerOpen}
                        setIsCreateColumnDrawerOpen={setIsCreateColumnDrawerOpen}
                      />
                      {columns?.length > 0 && (
                        <>
                          <CreateRowDrawer
                            isCreateRowDrawerOpen={isCreateRowDrawerOpen}
                            setIsCreateRowDrawerOpen={setIsCreateRowDrawerOpen}
                          />
                          <EditRowDrawer
                            isCreateRowDrawerOpen={isEditRowDrawerOpen}
                            setIsCreateRowDrawerOpen={setIsEditRowDrawerOpen}
                          />
                          <BulkUploadDrawer
                            isBulkUploadDrawerOpen={isBulkUploadDrawerOpen}
                            setIsBulkUploadDrawerOpen={setIsBulkUploadDrawerOpen}
                            bulkUploadFile={bulkUploadFile}
                            handleBulkUploadFileChange={handleBulkUploadFileChange}
                            handleBulkUpload={handleBulkUpload}
                            isBulkUploading={isBulkUploading}
                            errors={errors}
                          />
                        </>
                      )}
                    </div>
                    <div className="col-3 align-items-end">
                      <div className="row d-flex align-items-center justify-content-end">
                        <div className="col-4 p-0">
                          <Filter
                            filters={queryFilters}
                            setFilters={setQueryFilters}
                            handleBuildFilterQuery={handleBuildFilterQuery}
                            resetFilterQuery={resetFilterQuery}
                          />
                        </div>
                        <div className="col-3 p-0">
                          <Sort
                            filters={sortFilters}
                            setFilters={setSortFilters}
                            handleBuildSortQuery={handleBuildSortQuery}
                            resetSortQuery={resetSortQuery}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div >
            <div className={cx('col')}>
              <Table
                openCreateRowDrawer={() => setIsCreateRowDrawerOpen(true)}
                openCreateColumnDrawer={() => setIsCreateColumnDrawerOpen(true)}
              />
            </div>
          </>
        )}
      </div >
    </div >
  );
};

export default TooljetDatabasePage;
