import React, { useState } from 'react';
import {
  Constraints,
  FileTypeIcon,
  FileUploadIcon,
  InputFileLabel,
  RemoveIcon,
  UploadIcon,
} from './FileUploaderUtils/FileUploaderUtils';
import { Label } from '../Label/Label';

const MultipleInputFile = ({ width, ...props }) => {
  const [files, setFiles] = useState([]);
  const [isHovering, setIsHovering] = useState(false);

  const handleDragEnter = (event) => {
    event.preventDefault();
    setIsHovering(true);
  };
  const handleDragLeave = () => setIsHovering(false);
  const handleDrop = (event) => {
    event.preventDefault();
    console.log(event.dataTransfer.files);
    setIsHovering(false);
    const newFiles = Array.from(event.dataTransfer.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };
  const handleFileChange = (event) => {
    console.log(event.target.files);
    const newFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };
  const removeFile = (fileToRemove) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  return (
    <div style={{ width: width }}>
      {props.label && (
        <InputFileLabel
          label={props.label}
          helper={props.helperText}
          required={props.required}
          disabled={props.disabled}
        />
      )}
      <div
        className={`tw-h-[140px] tw-p-[24px] tw-mx-auto tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[6px] tw-rounded-[8px] tw-border tw-border-dashed tw-transition
          ${
            props.disabled
              ? 'tw-bg-background-surface-layer-02 tw-border-border-disabled'
              : isHovering
              ? 'tw-bg-background-accent-weak tw-border-interactive-focus-outline'
              : 'tw-bg-background-surface-layer-01 tw-border-border-default hover:tw-border-border-strong'
          }`}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className="tw-relative tw-h-[32px] tw-w-[32px] tw-flex tw-items-center tw-justify-center tw-shrink-0"
          onDragEnter={handleDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={handleDragLeave}
        >
          <FileUploadIcon isHovering={isHovering} disabled={props.disabled} />
          <UploadIcon
            className="tw-relative tw-right-[8px] tw-flex tw-items-start tw-gap-[10px] tw-shrink-0 tw-h-[11px] tw-w-[11px]"
            isHovering={isHovering}
            disabled={props.disabled}
          />
        </div>
        <p
          className={`tw-w-[130px] tw-text-center tw-text-[11px]/[16px] tw-font-medium ${
            props.disabled ? 'tw-text-text-disabled' : 'tw-text-text-medium'
          }`}
          onDragEnter={handleDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={handleDragLeave}
        >
          Drag and drop your files here or{' '}
          <label
            htmlFor="browse"
            className={props.disabled ? 'tw-text-text-disabled' : 'tw-text-text-accent cursor-pointer'}
          >
            browse
          </label>
        </p>
        <input
          type="file"
          id="browse"
          className="tw-hidden"
          multiple
          onChange={handleFileChange}
          disabled={props.disabled}
        />
      </div>
      {props.acceptedFormats && props.maxSize && (
        <Constraints formats={props.acceptedFormats} size={props.maxSize} disabled={props.disabled} />
      )}

      {files.length > 0 && (
        <div className="tw-mt-[24px]">
          <Label
            htmlFor="label"
            type="label"
            size="default"
            className={`tw-font-medium tw-ml-[2px] tw-mb-[4px] tw-text-text-default`}
          >
            Uploaded Files
          </Label>
          {files.map((file, index) => (
            <div
              key={index}
              className="tw-bg-background-surface-layer-02 tw-flex tw-items-center tw-justify-between tw-p-[8px] tw-rounded-[6px] tw-mb-[8px]"
            >
              <div className="tw-flex tw-items-start tw-flex-[1_0%_0%] tw-gap-[8px]">
                <div className="tw-bg-background-surface-layer-01 tw-flex tw-h-[36px] tw-w-[36px] tw-py-[7px] tw-px-[9px] tw-justify-center tw-items-center tw-rounded-[6px]">
                  <FileTypeIcon filetype={file.type} />
                </div>
                <div className="tw-flex tw-flex-col tw-flex-[1_0%_0%] tw-items-start">
                  <span className="tw-text-text-default tw-text-[12px]/[18px] tw-font-medium tw-line-clamp-1">
                    {file.name}
                  </span>
                  <span className="tw-text-[11px]/[16px] tw-font-normal tw-text-text-placeholder">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
              </div>
              <div className="tw-h-[36px] tw-flex tw-items-start">
                <div className="tw-flex tw-h-[20px] tw-w-[20px] tw-p-[4px] tw-items-center tw-justify-center tw-cursor-pointer">
                  <RemoveIcon onClick={() => removeFile(file)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultipleInputFile;
