import React, { useState, useContext, useCallback, useRef } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import { TooljetDatabaseContext } from '../../index';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { FileDropzone } from './FileDropzone';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';

import SolidIcon from '@/_ui/Icon/SolidIcons';

function BulkUploadDrawer({ isBulkUploadDrawerOpen, setIsBulkUploadDrawerOpen, handleFileChange }) {
  const { organizationId, selectedTable, setColumns, setSelectedTableData } = useContext(TooljetDatabaseContext);
  const hiddenFileInput = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (Math.round(file.size / 1024) > 1024) {
      toast.error('File size cannot exceed more than 1MB');
    } else {
      handleFileChange(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  return (
    <>
      <button
        onClick={() => setIsBulkUploadDrawerOpen(!isBulkUploadDrawerOpen)}
        className={`ghost-black-operation ${isBulkUploadDrawerOpen && 'open'}`}
      >
        <SolidIcon name="fileupload" width="14" fill={isBulkUploadDrawerOpen ? '#3E63DD' : '#889096'} />
        <span className=" tj-text-xsm font-weight-500" style={{ marginLeft: '6px' }}>
          Bulk upload data
        </span>
      </button>

      <Drawer isOpen={isBulkUploadDrawerOpen} onClose={() => setIsBulkUploadDrawerOpen(false)} position="right">
        <div className="drawer-card-wrapper ">
          <div className="drawer-card-title ">
            <h3 className="" data-cy="create-new-column-header">
              Bulk upload data
            </h3>
          </div>
          <div className="card-body">
            <div className="manage-users-drawer-content-bulk">
              <div className="manage-users-drawer-content-bulk-download-prompt">
                <div className="user-csv-template-wrap">
                  <div>
                    <SolidIcon name="information" fill="#F76808" width="26" />
                  </div>
                  <div>
                    <p className="tj-text tj-text-sm" data-cy="helper-text-bulk-upload">
                      Download the ToolJet template to add user details or format your file in the same as the template.
                      ToolJet won’t be able to recognise files in any other format.{' '}
                    </p>
                    <ButtonSolid
                      href="../../assets/csv/sample_upload.csv"
                      download="sample_upload.csv"
                      variant="tertiary"
                      className="download-template-btn"
                      as={'a'}
                      leftIcon="folderdownload"
                      iconWidth="13"
                      data-cy="button-download-template"
                    >
                      Download Template
                    </ButtonSolid>
                  </div>
                </div>
              </div>
              <FileDropzone
                handleClick={handleClick}
                hiddenFileInput={hiddenFileInput}
                errors={{}}
                handleFileChange={handleFileChange}
                inviteBulkUsers={() => {}}
                onDrop={onDrop}
              />
            </div>
          </div>
        </div>
        <div className="position-sticky bottom-0 right-0 w-100  mt-auto">
          <div className="d-flex justify-content-end drawer-footer-btn-wrap">
            <ButtonSolid variant="tertiary" data-cy={`cancel-button`} onClick={() => setIsBulkUploadDrawerOpen(false)}>
              Cancel
            </ButtonSolid>
            <ButtonSolid
              disabled={false}
              data-cy={`save-changes-button`}
              onClick={() => {}}
              fill="#fff"
              leftIcon="floppydisk"
            >
              Upload Data
            </ButtonSolid>
          </div>
        </div>
      </Drawer>
    </>
  );
}
export default BulkUploadDrawer;
