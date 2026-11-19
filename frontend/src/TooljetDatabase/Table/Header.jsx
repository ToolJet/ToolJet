import React, { useState, useEffect, useMemo } from 'react';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import CreateRowDrawer from '../Drawers/CreateRowDrawer';
import BulkUploadDrawer from '../Drawers/BulkUploadDrawer';
import SeedDataDrawer from '../Drawers/SeedDataDrawer';
import { isSqlModeDisabled } from '@/TooljetDatabase/constants';
import Filter from '../Filter';
import Sort from '../Sort';
import { DataToolbar } from './DataToolbar';
import { AddDataMenu } from './AddDataMenu';
import { toToolbarFilters } from './dataToolbarFilters';
import { pluralize } from '@/_helpers/utils';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import { isEmpty, omit } from 'lodash';
import config from 'config';
import { shallow } from 'zustand/shallow';
import { useTjdbStore, useTjdbActions, selectView } from '../_stores/tjdbStore';

const Header = ({
  isCreateColumnDrawerOpen,
  setIsCreateColumnDrawerOpen,
  isCreateRowDrawerOpen,
  setIsCreateRowDrawerOpen,
  setIsBulkUploadDrawerOpen,
  isBulkUploadDrawerOpen,
  isSeedDataDrawerOpen,
  setIsSeedDataDrawerOpen,
  setFilterEnable,
}) => {
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [errors, setErrors] = useState({ client: [], server: [] });
  const [uploadResult, setUploadResult] = useState(null);
  const { selectedTable, organizationId, handleRefetchQuery } = useTooljetDatabaseContext();
  const { queryFilters, sortFilters } = useTjdbStore(
    (state) => ({ queryFilters: selectView(state).queryFilters, sortFilters: selectView(state).sortFilters }),
    shallow
  );
  const { setQueryFilters, setSortFilters, openMigrationHistory } = useTjdbActions();
  const toolbarFilters = useMemo(() => toToolbarFilters(queryFilters), [queryFilters]);

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

    setBulkUploadFile(null);
    setIsBulkUploadDrawerOpen(false);
    setQueryFilters({});
    setSortFilters({});
    // Clearing an already-empty view leaves the query unchanged, so the uploaded rows need an explicit refetch.
    handleRefetchQuery();
    setIsBulkUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadResult]);

  const handleBulkUpload = async (event) => {
    event?.preventDefault();
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

      const { processed_rows: processedRows } = data.result;
      const toastMessage = `${pluralize(processedRows, 'row')} processed`;

      toast.success(toastMessage, {
        position: 'top-center',
      });

      setUploadResult({ processedRows });
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

    const maxFileSizeInMB = config.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB || 5;
    if (bulkUploadFile && bulkUploadFile.size / 1024 > maxFileSizeInMB * 1024) {
      fileValidationErrors.push(`File size cannot exceed ${maxFileSizeInMB}mb`);
    }

    setErrors({ server: [], client: fileValidationErrors });
  };

  return (
    <>
      <DataToolbar
        title={selectedTable.table_name}
        filters={toolbarFilters}
        onRemoveFilter={(id) => setQueryFilters((previous) => omit(previous, id))}
        onClearFilters={() => setQueryFilters({})}
        filterControl={<Filter filters={queryFilters} setFilters={setQueryFilters} setFilterEnable={setFilterEnable} />}
        sortControl={<Sort filters={sortFilters} setFilters={setSortFilters} />}
        onOpenHistory={openMigrationHistory}
        addData={
          <AddDataMenu
            onAddRow={() => setIsCreateRowDrawerOpen(true)}
            onBulkUpload={() => setIsBulkUploadDrawerOpen(true)}
            onSeedData={() => setIsSeedDataDrawerOpen(true)}
            hideSeedDataOption={isSqlModeDisabled()}
          />
        }
      />
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
      <SeedDataDrawer isSeedDataDrawerOpen={isSeedDataDrawerOpen} setIsSeedDataDrawerOpen={setIsSeedDataDrawerOpen} />
    </>
  );
};

export default Header;
