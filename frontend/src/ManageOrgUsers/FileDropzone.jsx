import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import { toast } from 'react-hot-toast';

export function FileDropzone({ handleClick, hiddenFileInput, errors, handleFileChange, inviteBulkUsers, onDrop }) {
  const [fileData, setFileData] = useState();
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: { parsedFileType: ['text/csv'] },
    onDrop,
    onDropRejected: (files) => {
      if (files[0].size > 1048576) {
        toast.error('File size cannot exceed more than 1MB');
      } else {
        toast.error('Please upload a CSV file');
      }
    },
    maxFiles: 1,
    onFileDialogCancel: () => {
      toast.error('Please upload a CSV file');
    },
    noKeyboard: true,
  });

  return (
    <form
      {...getRootProps({ className: 'dropzone' })}
      onSubmit={inviteBulkUsers}
      noValidate
      className="upload-user-form"
      id="inviteBulkUsers"
    >
      <div className="form-group mb-3 ">
        <div>
          <div className="csv-upload-icon-wrap" onClick={handleClick} data-cy="icon-bulk-upload">
            <BulkIcon name="fileupload" width="27" fill="#3E63DD" />
          </div>
          <p className="tj-text tj-text-md font-weight-500 select-csv-text" data-cy="helper-text-select-file">
            Select a CSV file to upload
          </p>
          <span className="tj-text tj-text-sm drag-and-drop-text" data-cy="helper-text-drop-file">
            {!isDragActive ? 'Or drag and drop it here' : ''}
          </span>
          <input
            {...getInputProps()}
            style={{ display: 'none' }}
            ref={hiddenFileInput}
            onChange={(e) => {
              const file = e.target.files[0];
              setFileData(file);
              if (Math.round(file.size / 1024) > 1024) {
                toast.error('File size cannot exceed more than 1MB');
                e.target.value = null;
              } else {
                handleFileChange(file);
              }
            }}
            accept=".csv"
            type="file"
            className="form-control"
            data-cy="input-field-bulk-upload"
          />
          <span className="file-upload-error" data-cy="file-error">
            {errors['file']}
          </span>
          <ul>{acceptedFiles}</ul>
          {fileData?.name && <ul>{` ${fileData?.name} - ${fileData?.size} bytes`}</ul>}
        </div>
      </div>
    </form>
  );
}
