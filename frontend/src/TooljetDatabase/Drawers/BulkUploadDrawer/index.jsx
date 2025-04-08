import React, { useState, useContext, useCallback, useRef } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import { TooljetDatabaseContext } from '../../index';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { FileDropzone } from './FileDropzone';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';

function BulkUploadDrawer({
  isBulkUploadDrawerOpen,
  setIsBulkUploadDrawerOpen,
  bulkUploadFile,
  handleBulkUploadFileChange,
  handleBulkUpload,
  isBulkUploading,
  errors,
}) {
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [progress, setProgress] = useState(0);
  const { columns, selectedTable } = useContext(TooljetDatabaseContext);
  const hiddenFileInput = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (Math.round(file.size / 1024) > 2 * 1024) {
      toast.error('File size cannot exceed more than 2MB');
    } else {
      handleBulkUploadFileChange(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTemplateDownload = () => {
    setIsDownloadingTemplate(true);

    return setTimeout(() => {
      // Create a CSV content string with the column names as the header row
      const headerRow = columns.map((col) => col.Header).join(',');
      const csvContent = [headerRow].join('\n');
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv' });
      // Create a temporary URL for the Blob
      const href = URL.createObjectURL(blob);
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = href;
      link.download = `${selectedTable.table_name}.csv`;
      // Trigger the download
      link.click();

      setIsDownloadingTemplate(false);

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
    }, 500);
  };

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  return (
    <>
      {/* <button
        onClick={() => setIsBulkUploadDrawerOpen(!isBulkUploadDrawerOpen)}
        className={`ghost-black-operation ${isBulkUploadDrawerOpen ? 'open' : ''}`}
        data-cy={`bulk-upload-data-button`}
      >
        <SolidIcon name="fileupload" width="14" fill={isBulkUploadDrawerOpen ? '#3E63DD' : '#889096'} />
        <span className=" tj-text-xsm font-weight-500" style={{ marginLeft: '6px' }} data-cy="bulk-upload-button-text">
          Bulk upload data
        </span>
      </button> */}

      <Drawer
        isOpen={isBulkUploadDrawerOpen}
        onClose={() => setIsBulkUploadDrawerOpen(false)}
        position="right"
        drawerStyle={{ 'overflow-y': 'hidden' }}
        className="tj-db-drawer"
      >
        <div className="drawer-card-wrapper">
          <div className="drawer-card-title ">
            <h3 className="" data-cy="bulk-upload-data-header">
              Bulk upload data
            </h3>
          </div>
          <div className="card-body tjdb-bulkupload-drawer">
            <div className="manage-users-drawer-content-bulk d-flex flex-column align-items-center m-0">
              <div
                className="manage-users-drawer-content-bulk-download-prompt"
                style={{ justifyContent: 'flex-start' }}
              >
                <div className="user-csv-template-wrap" style={{ marginTop: '0px' }}>
                  <div>
                    <SolidIcon name="information" fill="#F76808" width="26" />
                  </div>
                  <div>
                    <p className="tj-text tj-text-sm" data-cy="helper-text-bulk-upload">
                      Download the template to add your data or format your file in the same as the template. ToolJet
                      won’t be able to recognise files in any other format.
                    </p>
                    <ButtonSolid
                      variant="tertiary"
                      className="download-template-btn"
                      leftIcon="file01"
                      iconWidth="13"
                      data-cy="button-download-template"
                      isLoading={isDownloadingTemplate}
                      onClick={handleTemplateDownload}
                    >
                      Download Template
                    </ButtonSolid>
                  </div>
                </div>
              </div>
              <FileDropzone
                handleClick={handleClick}
                hiddenFileInput={hiddenFileInput}
                errors={errors}
                handleFileChange={handleBulkUploadFileChange}
                onButtonClick={handleBulkUpload}
                onDrop={onDrop}
                progress={progress}
                setProgress={setProgress}
              />
            </div>
          </div>
        </div>
        <DrawerFooter
          onClose={() => setIsBulkUploadDrawerOpen(false)}
          onCreate={handleBulkUpload}
          initiator={'UploadDataForm'}
          shouldDisableCreateBtn={
            !isBulkUploading &&
            (!bulkUploadFile || errors.client.length > 0 || errors.server.length > 0 || progress <= 99)
          }
          isBulkUploadDrawerOpen={isBulkUploadDrawerOpen}
          isBulkUploading={isBulkUploading}
        />
      </Drawer>
    </>
  );
}
export default BulkUploadDrawer;
