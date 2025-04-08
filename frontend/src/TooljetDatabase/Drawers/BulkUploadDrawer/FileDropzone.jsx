import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import BulkIcon from '@/_ui/Icon/BulkIcons';
import { toast } from 'react-hot-toast';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Tick from '../../Icons/Tick.svg';
import './styles.scss';

export function FileDropzone({
  handleClick,
  hiddenFileInput,
  errors,
  handleFileChange,
  onButtonClick,
  setProgress,
  progress,
}) {
  const divRef = useRef(null);
  const [divWidth, setDivWidth] = useState(0);
  const [fileData, setFileData] = useState();
  const duration = 1000;

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: { parsedFileType: ['text/csv'] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setFileData(file);
        handleFileChange(file);
      }
    },
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

  useEffect(() => {
    if (divRef.current) {
      const width = divRef.current.getBoundingClientRect().width;
      setDivWidth(width);
      handleProgressAnimation();
    }
  }, [fileData]);

  const handleProgressAnimation = () => {
    const startTime = Date.now();
    const updateProgress = () => {
      const runningTime = Date.now() - startTime;
      const progressPercentage = Math.min(1, runningTime / duration);
      setProgress(progressPercentage * 100);

      if (progressPercentage < 1) {
        requestAnimationFrame(updateProgress);
      }
    };
    requestAnimationFrame(updateProgress);
  };

  return (
    <>
      {fileData?.name ? (
        <div className="bulkUpload-file">
          <div className="fileName mt-3" ref={divRef}>
            {fileData?.name && (
              <ul className="m-0 p-0" data-cy="uploaded-file-data">{` ${fileData?.name} - ${fileData?.size} bytes`}</ul>
            )}
          </div>

          <div style={{ width: '486px' }}>
            {progress < 100 && (
              <progress style={{ width: divWidth }} className="progress progress-sm mt-3" value={progress} max="100" />
            )}
            {progress === 100 && !errors.client.length > 0 && !errors.server.length > 0 && (
              <div className="d-flex align-items-center justify-content-between readyForUpload-container">
                <Tick />
                <p className="m-0 readyForUpload">Ready for upload</p>
              </div>
            )}
            {errors.client.length > 0 && (
              <>
                <div className="error-1">
                  <SolidIcon name="reloaderror" width="16" height="17" />
                  <span className="file-upload-error">Kindly check the file and try again!</span>
                </div>
                <div className="error-2">
                  <span className="file-upload-error">{errors.client}</span>
                </div>
              </>
            )}
            {errors.server.length > 0 && (
              <>
                <div className="error-1">
                  <SolidIcon name="reloaderror" width="16" height="17" />
                  <span className="file-upload-error">Kindly check the file and try again!</span>
                </div>
                <div className="error-2">
                  <span className="file-upload-error">{errors.server}</span>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <form
          {...getRootProps({ className: 'dropzone' })}
          onSubmit={onButtonClick}
          noValidate
          className="upload-user-form"
          id="onButtonClick"
          style={{ cursor: 'pointer' }}
          onClick={handleClick}
        >
          <div className="form-group">
            <div>
              <div className="csv-upload-icon-wrap" data-cy="icon-bulk-upload">
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
              <ul>
                {acceptedFiles.map((file) => (
                  <li key={file.path}>{file.path}</li>
                ))}
              </ul>
              {fileData?.name && <ul data-cy="uploaded-file-data">{` ${fileData?.name} - ${fileData?.size} bytes`}</ul>}
            </div>
          </div>
        </form>
      )}
    </>
  );
}
