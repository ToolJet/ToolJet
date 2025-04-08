import React from 'react';
import PropTypes from 'prop-types';
import FileList from './FileList';

const FileListComponent = (props) => {
  return <FileList {...props} />;
};

export default FileListComponent;

FileListComponent.propTypes = {
  type: PropTypes.oneOf(['single', 'multiple']),
  files: PropTypes.array,
  onRemove: PropTypes.func,
  width: PropTypes.string,
  onRetry: PropTypes.func,
};

FileListComponent.defaultProps = {
  type: 'single',
  onRemove: () => {},
  width: '300px',
  onRetry: () => {},
};
