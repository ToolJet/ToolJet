import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import '../style.scss';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

const FileListItem = ({ fileName, fileSize, fileType, onDelete, onClick, error, isUploading, isUploaded }) => {
  const itemClasses = clsx('file-list-item', {
    error: !!error,
    uploading: isUploading,
  });

  return (
    <div className={itemClasses} onClick={onClick}>
      <div className="file-details">
        <span className="file-name" data-cy={`${generateCypressDataCy(fileName).replace(/\.[^/.]+$/, '')}-file-name`} title={fileName}>
          {typeof fileName === 'string' ? fileName.replace(/\.[^/.]+$/, '') : fileName}
        </span>
        <span className="file-meta" data-cy={`${generateCypressDataCy(fileType)}-${generateCypressDataCy(fileSize).replace(/\.[^/.]+$/, '')}-file-meta`}>
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
          data-cy={`${generateCypressDataCy(fileName)}-file-delete-button`}
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
};

FileListItem.defaultProps = {
  error: null,
  isUploading: false,
  isUploaded: false,
};

export default FileListItem;
