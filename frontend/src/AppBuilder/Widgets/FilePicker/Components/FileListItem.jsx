import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import '../style.scss';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

const FileListItem = ({ fileName, fileSize, fileType, onDelete, onClick, error, isUploading, isUploaded, dataCy }) => {
  const itemClasses = clsx('file-list-item', {
    error: !!error,
    uploading: isUploading,
  });
  const displayName = typeof fileName === 'string' ? fileName.replace(/\.[^/.]+$/, '') : fileName;
  const cyBase = `${dataCy}-${generateCypressDataCy(displayName)}`;

  return (
    <div className={itemClasses} onClick={onClick}>
      <div className="file-details">
        <span className="file-name" data-cy={`${cyBase}-file-name`} title={fileName}>
          {displayName}
        </span>
        <span className="file-meta" data-cy={`${cyBase}-file-meta`}>
          {fileType} {fileSize}
        </span>
      </div>

      {!isUploading && (
        <ButtonSolid
          className="delete-button"
          variant="tertiary"
          size="xs"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          data-cy={`${cyBase}-file-delete-button`}
        >
          <Trash width={12} fill="var(--icon-strong)" />
        </ButtonSolid>
      )}
    </div>
  );
};

FileListItem.propTypes = {
  fileName: PropTypes.string.isRequired,
  fileSize: PropTypes.string.isRequired,
  fileType: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  error: PropTypes.string,
  isUploading: PropTypes.bool,
  isUploaded: PropTypes.bool,
  dataCy: PropTypes.string,
};

FileListItem.defaultProps = {
  error: null,
  isUploading: false,
  isUploaded: false,
  dataCy: 'file-picker',
};

export default FileListItem;
