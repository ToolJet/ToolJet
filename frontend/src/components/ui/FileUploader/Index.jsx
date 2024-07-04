import React from 'react';
import PropTypes from 'prop-types';
import MultipleInputFile from './MultipleInputFile';
import SingleInputFile from './SingleInputFile';

const FileUploaderComponent = (props) => {
  return props.type === 'single' ? <SingleInputFile {...props} /> : <MultipleInputFile {...props} />;
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
