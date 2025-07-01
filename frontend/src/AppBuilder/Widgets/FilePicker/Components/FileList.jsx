import React from 'react';
import PropTypes from 'prop-types';
import FileListItem from './FileListItem';
import { formatFileSize } from '@/_helpers/utils';

const FileList = ({ files, onRemoveFile, errors = {}, uploadingStatus = {} }) => {
  // TODO: Need to get file size formatting function, e.g., from @/_helpers/utils
  // const formatFileSize = (bytes) => { ... }; // Placeholder

  return (
    <div className="file-list-container">
      {files.map((file, index) => {
        // Extract file extension for display if needed
        const fileExtension = file.name.split('.').pop();
        // Determine error state for this specific file
        const fileError = errors[file.name] || null; // Example: Assuming errors object is keyed by file name
        // Determine uploading state for this specific file
        const isUploading = uploadingStatus[file.name] === 'uploading'; // Example: Assuming status object
        const isUploaded = uploadingStatus[file.name] === 'uploaded'; // Example: Assuming status object

        return (
          <FileListItem
            key={file.name + index} // Using name + index for key, consider a more stable unique ID if available
            fileName={file.name}
            // Assuming file size is available, might need adjustment based on actual file object structure
            fileSize={formatFileSize(file.size || 0)} // Use formatted size, handle missing size
            fileType={`.${fileExtension}`} // Displaying extension as file type
            onDelete={() => onRemoveFile(index)} // Pass index or file identifier to remove function
            onClick={() => {
              /* Handle click if needed */
            }}
            error={fileError}
            isUploading={isUploading}
            isUploaded={isUploaded}
            // Pass other necessary props based on FileListItem implementation
          />
        );
      })}
    </div>
  );
};

FileList.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      size: PropTypes.number, // Size might not always be present initially
      type: PropTypes.string,
      // Include other expected file properties if needed
    })
  ).isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  errors: PropTypes.object, // Shape depends on how errors are structured
  uploadingStatus: PropTypes.object, // Shape depends on how status is structured
};

export default FileList; 