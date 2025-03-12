import React from 'react';
import PropTypes from 'prop-types';
import FileUpload from './FileUpload';

const FileUploadComponent = (props) => {
  return <FileUpload {...props} />;
};

export default FileUploadComponent;

FileUploadComponent.propTypes = {
  type: PropTypes.oneOf(['single', 'multiple']),
  files: PropTypes.array,
  onFilesChange: PropTypes.func,
  width: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  acceptedFormats: PropTypes.string,
  maxSize: PropTypes.number,
};

FileUploadComponent.defaultProps = {
  type: 'single',
  onFilesChange: () => {},
  width: '300px',
  label: '',
  helperText: '',
  required: false,
  disabled: false,
  acceptedFormats: '',
};
