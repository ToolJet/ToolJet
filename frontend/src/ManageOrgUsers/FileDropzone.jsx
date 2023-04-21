import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import { toast } from 'react-hot-toast';

export function FileDropzone({ handleClick, hiddenFileInput, errors, handleFileChange, inviteBulkUsers, onDrop }) {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: 'text/csv',
  });
  const [fileData, setFileData] = useState();

  const files =
    acceptedFiles.length > 0
      ? acceptedFiles
      : acceptedFiles?.map((file) => (
          <li key={file.path}>
            {file.path} - {file.size} bytes
          </li>
        ));
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
          <div className="csv-upload-icon-wrap" onClick={handleClick}>
            <BulkIcon name="fileupload" width="27" fill="#3E63DD" />
          </div>
          <p className="tj-text tj-text-md font-weight-500 select-csv-text">Select a CSV file to upload</p>
          <span className="tj-text tj-text-sm drag-and-drop-text">
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
          />
          <span className="file-upload-error" data-cy="file-error">
            {errors['file']}
          </span>
          <ul>{files}</ul>
          {fileData?.name && <ul>{` ${fileData?.name} - ${fileData?.size} bytes`}</ul>}
        </div>
      </div>
    </form>
  );
}
