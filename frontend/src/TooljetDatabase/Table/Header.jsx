import React, { useState, useContext, useEffect } from 'react';
import { TooljetDatabaseContext } from '../index';
import EditRowDrawer from '../Drawers/EditRowDrawer';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import CreateRowDrawer from '../Drawers/CreateRowDrawer';
import BulkUploadDrawer from '../Drawers/BulkUploadDrawer';
import Filter from '../Filter';
import Sort from '../Sort';
import Plus from '@/_ui/Icon/solidIcons/Plus';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { AddNewDataPopOver } from './ActionsPopover/AddNewDataPopOver';
import { pluralize } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { isEmpty } from 'lodash';
import DeleteIcon from '../Icons/DeleteIcon.svg';

const Header = ({
  isCreateColumnDrawerOpen,
  setIsCreateColumnDrawerOpen,
  isCreateRowDrawerOpen,
  setIsCreateRowDrawerOpen,
  selectedRowIds,
  handleDeleteRow,
  rows,
  isEditRowDrawerOpen,
  setIsEditRowDrawerOpen,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [isAddNewDataMenuOpen, setIsAddNewDataMenuOpen] = useState(false);
  const [isBulkUploadDrawerOpen, setIsBulkUploadDrawerOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [errors, setErrors] = useState({ client: [], server: [] });
  const [uploadResult, setUploadResult] = useState(null);
  const {
    columns,
    totalRecords,
    sortFilters,
    setSortFilters,
    handleBuildSortQuery,
    resetFilterQuery,
    resetSortQuery,
    queryFilters,
    setQueryFilters,
    handleBuildFilterQuery,
    selectedTable,
    organizationId,
    setTotalRecords,
    setSelectedTableData,
  } = useContext(TooljetDatabaseContext);

  useEffect(() => {
    setErrors({ client: [], server: [] });
    handleFileValidation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkUploadFile]);

  useEffect(() => {
    if (!isBulkUploadDrawerOpen) {
      setErrors({ client: [], server: [] });
      setBulkUploadFile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBulkUploadDrawerOpen]);

  useEffect(() => {
    if (isEmpty(selectedTable)) return;

    const reloadTableData = async () => {
      const { headers, data, error } = await tooljetDatabaseService.findOne(
        organizationId,
        selectedTable.id,
        'order=id.desc'
      );

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
    setQueryFilters({});
    resetFilterQuery();
    setSortFilters({});
    resetSortQuery();
    reloadTableData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult]);

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
      const toastMessage =
        `${pluralize(rowsInserted, 'new row')} added, ` + `${pluralize(rowsUpdated, 'row')} updated.`;

      toast.success(toastMessage, {
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

  const handleFileValidation = () => {
    const fileValidationErrors = [];

    if (bulkUploadFile && bulkUploadFile.size / 1024 > 2 * 1024) {
      fileValidationErrors.push('File size cannot exceed 2mb');
    }

    setErrors({ server: [], client: fileValidationErrors });
  };

  const toggleAddNewDataMenu = (isShow) => {
    setIsAddNewDataMenuOpen(isShow);
  };

  const handleOnClickCreateNewRow = (isOpenCreateNewRowDrawer) => {
    setIsCreateRowDrawerOpen(isOpenCreateNewRowDrawer);
  };

  const handleOnClickBulkUpdateData = (isOpenBulkUploadDrawer) => {
    setIsBulkUploadDrawerOpen(isOpenBulkUploadDrawer);
  };

  return (
    <>
      <div className="database-table-header-wrapper">
        <div className="card border-0">
          <div className="card-body  tj-db-operations-header">
            <div className="row align-items-center">
              <div className="col-8 align-items-center p-3 gap-1">
                <>
                  {columns?.length > 0 && (
                    <>
                      {Object.keys(selectedRowIds).length === 0 && (
                        <>
                          <AddNewDataPopOver
                            disabled={false}
                            show={isAddNewDataMenuOpen}
                            darkMode={darkMode}
                            toggleAddNewDataMenu={toggleAddNewDataMenu}
                            handleOnClickCreateNewRow={handleOnClickCreateNewRow}
                            handleOnClickBulkUpdateData={handleOnClickBulkUpdateData}
                          >
                            <span className="col-auto">
                              <ButtonSolid
                                variant="tertiary"
                                disabled={false}
                                onClick={() => toggleAddNewDataMenu(true)}
                                size="sm"
                                className="px-1 pe-3 ps-2 gap-0"
                                data-cy="add-new-data-button"
                              >
                                <Plus fill="#697177" style={{ height: '16px' }} />
                                Add new data
                              </ButtonSolid>
                            </span>
                          </AddNewDataPopOver>
                          <div style={{ width: '70px' }}>
                            <Filter
                              filters={queryFilters}
                              setFilters={setQueryFilters}
                              handleBuildFilterQuery={handleBuildFilterQuery}
                              resetFilterQuery={resetFilterQuery}
                            />
                          </div>
                          <div style={{ width: '70px' }}>
                            <Sort
                              filters={sortFilters}
                              setFilters={setSortFilters}
                              handleBuildSortQuery={handleBuildSortQuery}
                              resetSortQuery={resetSortQuery}
                            />
                          </div>
                        </>
                      )}

                      {Object.keys(selectedRowIds).length === 1 ? (
                        <EditRowDrawer
                          isEditRowDrawerOpen={isEditRowDrawerOpen}
                          setIsEditRowDrawerOpen={setIsEditRowDrawerOpen}
                          selectedRowIds={selectedRowIds}
                          rows={rows}
                        />
                      ) : null}
                      {Object.keys(selectedRowIds).length > 0 && (
                        <div>
                          <ButtonSolid
                            variant="dangerTertiary"
                            onClick={handleDeleteRow}
                            size="sm"
                            className="gap-0"
                            data-cy="delete-row-records-button"
                            style={{
                              padding: '4px 8px 4px 8px',
                            }}
                          >
                            <DeleteIcon />
                            &nbsp; {Object.keys(selectedRowIds).length === 1 ? 'Delete row' : 'Delete rows'}
                          </ButtonSolid>
                        </div>
                      )}
                    </>
                  )}
                </>
              </div>
              <div className="col-4">
                <div className="d-flex align-items-center justify-content-end">
                  {Object.keys(selectedRowIds).length === 0 && (
                    <div
                      className="p-1"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <span data-cy="total-records">{totalRecords} records</span>
                    </div>
                  )}

                  {Object.keys(selectedRowIds).length > 0 && (
                    <div
                      className="p-1"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      <span data-cy="total-records-selected">
                        {Object.keys(selectedRowIds).length}{' '}
                        {Object.keys(selectedRowIds).length > 1 ? 'records' : 'record'} selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CreateColumnDrawer
        isCreateColumnDrawerOpen={isCreateColumnDrawerOpen}
        setIsCreateColumnDrawerOpen={setIsCreateColumnDrawerOpen}
      />
      <CreateRowDrawer
        isCreateRowDrawerOpen={isCreateRowDrawerOpen}
        setIsCreateRowDrawerOpen={setIsCreateRowDrawerOpen}
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
  );
};

export default Header;
