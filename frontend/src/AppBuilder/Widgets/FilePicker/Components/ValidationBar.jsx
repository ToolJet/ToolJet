import React from 'react';
import PropTypes from 'prop-types';
import { formatFileSize } from '@/_helpers/utils'; // Import the utility

const ValidationBar = ({
  minSize,
  maxSize,
  selectedFileCount,
  minFileCount, // Added minFileCount prop
  maxFileCount,
  enableMultiple,
}) => {
  const showSizeValidation = minSize > 0 || (maxSize > 0 && maxSize < Infinity); // Check if size limits are meaningful
  // Show count validation if multiple files are enabled OR if a minimum is set (even for single file upload)
  const showCountValidation = enableMultiple || minFileCount > 0;

  // Don't render if no validation info is relevant
  if (!showSizeValidation && !showCountValidation) {
    return null;
  }

  // Helper to construct count text
  const getCountText = () => {
    if (!showCountValidation) return null;

    const maxCountText = maxFileCount > 0 ? `${maxFileCount}` : 'any';

    if (minFileCount > 0 && maxFileCount > 0 && minFileCount !== maxFileCount) {
      // Min and Max count differ
      return `${selectedFileCount} (${minFileCount}-${maxCountText} files)`;
    } else if (minFileCount > 0 && (maxFileCount <= 0 || minFileCount === maxFileCount)) {
      // Only Min count (or min equals max)
      return `${selectedFileCount} (Min ${minFileCount} file${minFileCount !== 1 ? 's' : ''})`;
    } else if (maxFileCount > 0) {
      // Only Max count (standard case)
      return `${selectedFileCount}/${maxCountText}`;
    }
    return null; // Should not happen if showCountValidation is true
  };

  const countText = getCountText();

  return (
    <div className="validation-bar">
      {/* Size Validation Info */}
      {showSizeValidation && (
        <span className="validation-info size-info">
          {minSize > 0 && maxSize < Infinity
            ? `${formatFileSize(minSize)} to ${formatFileSize(maxSize)}` // Min and Max
            : maxSize < Infinity && maxSize > 0
            ? `Up to ${formatFileSize(maxSize)}` // Only Max
            : `Min ${formatFileSize(minSize)}`}
        </span>
      )}

      {countText && <span className="validation-info count-info">{countText}</span>}
    </div>
  );
};

ValidationBar.propTypes = {
  minSize: PropTypes.number,
  maxSize: PropTypes.number,
  selectedFileCount: PropTypes.number.isRequired,
  minFileCount: PropTypes.number, // Added prop type
  maxFileCount: PropTypes.number,
  enableMultiple: PropTypes.bool,
};

ValidationBar.defaultProps = {
  minSize: 0,
  maxSize: Infinity, // Use Infinity for no practical upper limit
  minFileCount: 0, // Default min count
  maxFileCount: 0, // Default to 0 if not multiple or specified
  enableMultiple: false,
};

export default ValidationBar;
