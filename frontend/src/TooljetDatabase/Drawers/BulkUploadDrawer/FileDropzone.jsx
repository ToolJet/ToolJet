import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { CircleAlert, CircleCheck, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const duration = 1000;

export function FileDropzone({ handleClick, hiddenFileInput, errors, handleFileChange, setProgress, progress }) {
  const [fileData, setFileData] = useState();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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

  // A new file restarts the fake "reading the file" progress.
  useEffect(() => {
    if (!fileData) return;
    const startTime = Date.now();
    const updateProgress = () => {
      const progressPercentage = Math.min(1, (Date.now() - startTime) / duration);
      setProgress(progressPercentage * 100);
      if (progressPercentage < 1) requestAnimationFrame(updateProgress);
    };
    requestAnimationFrame(updateProgress);
  }, [fileData]);

  const errorMessages = [errors.client, errors.server].filter((error) => error.length > 0);

  if (fileData?.name) {
    return (
      <div className="tw-flex tw-flex-col tw-gap-2" data-cy="bulk-upload-file">
        <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-px-3 tw-py-2">
          <FileUp aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-weak" />
          <span
            className="tw-min-w-0 tw-truncate tw-font-body-default tw-text-text-default"
            data-cy="uploaded-file-data"
          >
            {`${fileData.name} - ${fileData.size} bytes`}
          </span>
        </div>

        {progress < 100 && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="tw-h-1 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-background-surface-layer-03"
          >
            <div className="tw-h-full tw-bg-button-primary" style={{ width: `${progress}%` }} />
          </div>
        )}

        {progress === 100 && errorMessages.length === 0 && (
          <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-text-success">
            <CircleCheck aria-hidden className="tw-size-4" />
            <span className="tw-font-body-default">Ready for upload</span>
          </div>
        )}

        {errorMessages.length > 0 && (
          <div className="tw-flex tw-flex-col tw-gap-1 tw-text-text-danger" data-cy="bulk-upload-error">
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <CircleAlert aria-hidden className="tw-size-4 tw-shrink-0" />
              <span className="tw-font-title-default">Kindly check the file and try again!</span>
            </div>
            {errorMessages.map((message) => (
              <span key={message} className="tw-break-words tw-font-body-default">
                {message}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps({
        className: cn(
          'tw-flex tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-md tw-border tw-border-dashed tw-border-border-default tw-px-4 tw-py-8 tw-text-center',
          'hover:tw-bg-interactive-hover',
          isDragActive && 'tw-border-border-accent-strong tw-bg-background-accent-weak'
        ),
      })}
      onClick={handleClick}
      data-cy="bulk-upload-dropzone"
    >
      <FileUp aria-hidden className="tw-size-6 tw-text-icon-accent" data-cy="icon-bulk-upload" />
      <p className="tw-m-0 tw-font-title-default tw-text-text-default" data-cy="helper-text-select-file">
        Select a CSV file to upload
      </p>
      <span className="tw-font-body-default tw-text-text-placeholder" data-cy="helper-text-drop-file">
        {isDragActive ? 'Drop the file here' : 'Or drag and drop it here'}
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
        data-cy="input-field-bulk-upload"
      />
    </div>
  );
}
