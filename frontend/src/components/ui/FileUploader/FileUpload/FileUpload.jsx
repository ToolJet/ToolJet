import React, { useState } from 'react';
import { Constraints, FileUploadIcon, InputFileLabel, UploadIcon } from '../FileUploaderUtils/FileUploaderUtils';

const FileUpload = ({
  type,
  files,
  onFilesChange,
  width,
  label,
  helperText,
  required,
  disabled,
  acceptedFormats,
  maxSize,
}) => {
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
    if (type === 'multiple') {
      onFilesChange((prevFiles) => [...prevFiles, ...newFiles]);
    }
    if (type === 'single') {
      onFilesChange([...newFiles]);
    }
  };

  const handleFileChange = (event) => {
    console.log(event.target.files);
    const newFiles = Array.from(event.target.files);
    if (type === 'multiple') {
      onFilesChange((prevFiles) => [...prevFiles, ...newFiles]);
    }
    if (type === 'single') {
      onFilesChange([...newFiles]);
    }
  };

  const handleClick = () => {
    document.getElementById('browse').click();
  };

  return (
    <div style={{ width: width }}>
      {label && <InputFileLabel label={label} helper={helperText} required={required} disabled={disabled} />}
      {((type === 'single' && files.length === 0) || type === 'multiple') && (
        <div
          className={`tw-cursor-pointer tw-h-[140px] tw-p-[24px] tw-mx-auto tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[6px] tw-rounded-[8px] tw-border tw-border-dashed tw-transition
          ${
            disabled
              ? 'tw-bg-background-surface-layer-02 tw-border-border-disabled'
              : isHovering
              ? 'tw-bg-background-accent-weak tw-border-interactive-focus-outline'
              : 'tw-bg-background-surface-layer-01 tw-border-border-default hover:tw-bg-[#CCD1D5]/30 hover:tw-border-border-strong'
          }`}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div
            className="tw-relative tw-h-[32px] tw-w-[32px] tw-flex tw-items-center tw-justify-center tw-shrink-0"
            onDragEnter={handleDragEnter}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={handleDragLeave}
          >
            <FileUploadIcon isHovering={isHovering} disabled={disabled} />
            <UploadIcon
              className="tw-relative tw-right-[8px] tw-flex tw-items-start tw-gap-[10px] tw-shrink-0 tw-h-[11px] tw-w-[11px]"
              isHovering={isHovering}
              disabled={disabled}
            />
          </div>
          <p
            className={`tw-w-[130px] tw-text-center tw-text-[11px]/[16px] tw-font-medium ${
              disabled ? 'tw-text-text-disabled' : 'tw-text-text-medium'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={handleDragLeave}
          >
            Drag and drop your files here or{' '}
            <label
              htmlFor="browse"
              className={disabled ? 'tw-text-text-disabled' : 'tw-text-text-accent tw-cursor-pointer'}
            >
              browse
            </label>
          </p>
          <input
            type="file"
            id="browse"
            className="tw-hidden"
            multiple={type === 'multiple'}
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      )}
      {((type === 'multiple' && acceptedFormats && maxSize) ||
        (type === 'single' && files.length === 0 && acceptedFormats && maxSize)) && (
        <Constraints formats={acceptedFormats} size={maxSize} disabled={disabled} />
      )}
    </div>
  );
};

export default FileUpload;
