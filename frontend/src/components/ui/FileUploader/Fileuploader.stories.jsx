import React, { useState } from 'react';
import FileUploadComponent from './FileUpload/Index';
import FileListComponent from './FileList/Index';

export default {
  title: 'Components/FileUploader',
  component: FileUploadComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      options: ['single', 'multiple'],
      control: {
        type: 'select',
      },
    },
    width: {
      control: 'text',
    },
    id: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    ariaLabel: {
      control: 'text',
    },
    required: {
      control: 'boolean',
    },
    helperText: {
      control: 'text',
    },
    acceptedFormats: {
      control: 'text',
    },
    maxSize: {
      control: 'number',
    },
    onRetry: {
      control: 'function',
    },
  },
};

const Template = ({
  type,
  width,
  id,
  disabled,
  label,
  ariaLabel,
  required,
  helperText,
  acceptedFormats,
  maxSize,
  onRetry,
}) => {
  const [files, setFiles] = useState([]);

  const removeFile = (fileToRemove) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  return (
    <div>
      <FileUploadComponent
        id={id}
        aria-label={ariaLabel}
        type={type}
        files={files}
        onFilesChange={setFiles}
        width={width}
        label={label}
        helperText={helperText}
        required={required}
        disabled={disabled}
        acceptedFormats={acceptedFormats}
        maxSize={maxSize}
      />
      <FileListComponent type={type} files={files} onRemove={removeFile} width={width} onRetry={onRetry} />
    </div>
  );
};

export const RocketFileUploader = Template.bind({});
RocketFileUploader.args = {
  type: 'single',
  width: '300px',
  label: 'Label text',
  helperText: 'This is a description',
  required: false,
  disabled: false,
  acceptedFormats: 'PNG, JPG, PDF',
  maxSize: 10,
};
