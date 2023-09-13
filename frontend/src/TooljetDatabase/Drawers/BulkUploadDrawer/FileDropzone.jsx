import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import { toast } from 'react-hot-toast';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export function FileDropzone({ handleClick, hiddenFileInput, errors, handleFileChange, onButtonClick, onDrop }) {
  const [fileData, setFileData] = useState();
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: { parsedFileType: ['text/csv'] },
    onDrop,
    noClick: true,
    onDropRejected: (files) => {
      if (Math.round(files[0].size / 1024) > 2 * 1024) {
        handleFileChange(files[0]);
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
      onSubmit={onButtonClick}
      noValidate
      className="upload-user-form"
      id="onButtonClick"
    >
      <div className="form-group">
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
              handleFileChange(file);
            }}
            accept=".csv"
            type="file"
            className="form-control"
            data-cy="input-field-bulk-upload"
          />
          <ul>{acceptedFiles}</ul>
          {fileData?.name && <ul data-cy="uploaded-file-data">{` ${fileData?.name} - ${fileData?.size} bytes`}</ul>}
        </div>
        {errors.client.length > 0 && (
          <>
            <div>
              <SolidIcon name="reloaderror" width="16" height="17" />
              <span className="file-upload-error">Kindly check the file and try again!</span>
            </div>
            <div>
              <span className="file-upload-error">{errors.client}</span>
            </div>
          </>
        )}
        {errors.server.length > 0 && (
          <>
            <div>
              <SolidIcon name="reloaderror" width="16" height="17" />
              <span className="file-upload-error">Kindly check the file and try again!</span>
            </div>
            <div>
              <span className="file-upload-error">{errors.server}</span>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
