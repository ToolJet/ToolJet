import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FileUploadComponent from './FileUpload/FileUpload';
import FileListComponent from './FileList/FileList';

const FileUploaderComponent = (props) => {
  const [files, setFiles] = useState([]);

  const removeFile = (fileToRemove) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  return (
    <div>
      <FileUploadComponent
        type={props.type}
        files={files}
        onFilesChange={setFiles}
        width={props.width}
        label={props.label}
        helperText={props.helperText}
        required={props.required}
        disabled={props.disabled}
        acceptedFormats={props.acceptedFormats}
        maxSize={props.maxSize}
      />
      <FileListComponent type={props.type} files={files} onRemove={removeFile} width={props.width} />
    </div>
  );
};

export default FileUploaderComponent;

FileUploaderComponent.propTypes = {
  type: PropTypes.oneOf(['single', 'multiple']),
  width: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  'aria-label': PropTypes.string,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  acceptedFormats: PropTypes.string,
  maxSize: PropTypes.number,
};

FileUploaderComponent.defaultProps = {
  type: 'single',
  width: '300px',
  name: '',
  id: '',
  disabled: false,
  label: '',
  'aria-label': '',
  required: false,
  helperText: '',
  acceptedFormats: '',
  maxSize: 0,
};
