import React, { useCallback, useRef, useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconFileTypeCsv,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { Spinner } from 'react-bootstrap';
import Drawer from '@/_ui/Drawer';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { organizationUserService } from '@/_services';
import { getHostURL } from '@/_helpers/routes';
import {
  bulkUploadFileTooLargeMessage,
  getBulkUploadMaxFileSizeBytes,
  getBulkUploadMaxFileSizeMb,
  isBulkUploadFileTooLarge,
} from '../../bulkUploadLimits';
import './BulkUploadUsersDrawer.scss';

const DOCS_URL = 'https://docs.tooljet.com/docs/user-management/onboard-users/bulk-invite-users';

const IDLE = { status: 'idle', summary: null, errors: [], file: null };

// Server errors come as { error: title, data: string[] } for file problems, or a plain message otherwise.
const toErrorList = (error) => {
  if (Array.isArray(error?.data) && error.data.length) return error.data;
  if (typeof error === 'string') return [error];
  return [error?.error || 'Please check the format of the CSV file and try again'];
};

const describeSummary = ({ added, updated, archived, unarchived, unchanged }) => {
  const parts = [
    added && `${added} new`,
    updated && `${updated} updated`,
    archived && `${archived} archived`,
    unarchived && `${unarchived} unarchived`,
    unchanged && `${unchanged} unchanged`,
  ].filter(Boolean);
  return parts.length ? `Ready to upload: ${parts.join(' · ')}` : 'No changes found in this file';
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// EE only: add or update users from a CSV. The file is validated as soon as it's picked; Upload is only
// enabled for that exact file once validation succeeds, because the server applies it without re-validating.
export default function BulkUploadUsersDrawer({ isOpen, onClose, onUploaded }) {
  const [validation, setValidation] = useState(IDLE);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const currentFile = useRef(null);

  const validateFile = useCallback((file) => {
    currentFile.current = file;
    setValidation({ ...IDLE, status: 'validating', file });
    const formData = new FormData();
    formData.append('file', file);
    organizationUserService
      .validateBulkUpload(formData)
      .then(({ summary }) => {
        if (currentFile.current !== file) return; // a newer file was picked meanwhile
        setValidation({ ...IDLE, status: 'valid', summary, file });
      })
      .catch(({ error }) => {
        if (currentFile.current !== file) return;
        setValidation({ ...IDLE, status: 'invalid', errors: toErrorList(error), file });
      });
  }, []);

  const onFileSelected = useCallback(
    (file) => {
      if (!file) return;
      if (isBulkUploadFileTooLarge(file)) {
        toast.error(bulkUploadFileTooLargeMessage());
        return;
      }
      validateFile(file);
    },
    [validateFile]
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: getBulkUploadMaxFileSizeBytes(),
    noClick: true,
    noKeyboard: true,
    onDropAccepted: (files) => onFileSelected(files[0]),
    onDropRejected: (rejections) => {
      const isTooLarge = rejections[0]?.errors?.some((error) => error.code === 'file-too-large');
      toast.error(isTooLarge ? bulkUploadFileTooLargeMessage() : 'Please upload a CSV file');
    },
  });

  const removeFile = () => {
    currentFile.current = null;
    setValidation(IDLE);
  };

  const close = () => {
    removeFile();
    onClose();
  };

  const exportCurrentUsers = () => {
    setExporting(true);
    organizationUserService
      .exportUsersCsv()
      .then((blob) => downloadBlob(blob, 'users.csv'))
      .catch(({ error } = {}) => toast.error(error || 'Could not download the current users list'))
      .finally(() => setExporting(false));
  };

  const upload = () => {
    const { file, status } = validation;
    if (status !== 'valid' || !file || currentFile.current !== file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    organizationUserService
      .inviteBulkUsers(formData)
      .then((res) => {
        toast.success(res.message, { position: 'top-center' });
        onUploaded();
        close();
      })
      // The workspace can change between validation and upload; show those errors in the same list.
      .catch(({ error }) => setValidation({ ...IDLE, status: 'invalid', errors: toErrorList(error), file }))
      .finally(() => setUploading(false));
  };

  const { status, file, errors, summary } = validation;

  return (
    <Drawer disableFocus={true} isOpen={isOpen} onClose={close} position="right">
      <div className="animation-fade invite-user-drawer-wrap bulk-upload-drawer">
        <div className="bulk-upload-drawer-header">
          <h3 className="tj-text-lg font-weight-500 m-0" data-cy="bulk-upload-drawer-title">
            Bulk upload users via CSV
          </h3>
          <button className="bulk-upload-icon-btn" onClick={close} aria-label="Close" data-cy="close-button">
            <SolidIcon name="remove" width="16" />
          </button>
        </div>

        <div className="bulk-upload-drawer-body">
          <section>
            <p className="tj-text-sm font-weight-500 mb-1">Download CSV template</p>
            <p className="tj-text-xsm bulk-upload-muted mb-2">
              Start with a blank template to invite new users or export the current users list, pre-filled, to edit and
              re-upload for updates.
            </p>
            <div className="d-flex gap-2">
              <ButtonSolid
                as="a"
                href={`${getHostURL()}/assets/csv/sample_upload.csv`}
                download="sample_upload.csv"
                variant="tertiary"
                size="sm"
                leftIcon="IconDownload"
                isTablerIcon
                iconWidth="14"
                data-cy="button-download-empty-template"
              >
                Empty template
              </ButtonSolid>
              <ButtonSolid
                variant="tertiary"
                size="sm"
                leftIcon="IconDownload"
                isTablerIcon
                iconWidth="14"
                onClick={exportCurrentUsers}
                isLoading={exporting}
                disabled={exporting}
                data-cy="button-download-current-users"
              >
                Current users list
              </ButtonSolid>
            </div>
          </section>

          <section>
            <p className="tj-text-sm font-weight-500 mb-2">Upload CSV</p>
            <div {...getRootProps()}>
              <input {...getInputProps()} data-cy="input-field-bulk-upload" />
              {!file ? (
                <>
                  <div
                    className={`bulk-upload-dropzone ${isDragActive ? 'active' : ''}`}
                    data-cy="bulk-upload-dropzone"
                  >
                    <SolidIcon name="fileupload" width="20" fill="var(--icon-default)" />
                    <p className="tj-text-xsm m-0">
                      Drag and drop your files
                      <br />
                      here or{' '}
                      <button type="button" className="bulk-upload-link" onClick={open}>
                        browse
                      </button>
                    </p>
                  </div>
                  <div className="d-flex justify-content-between bulk-upload-hint bulk-upload-muted mt-1">
                    <span>Supported formats: CSV</span>
                    <span>Max: {getBulkUploadMaxFileSizeMb()} mb</span>
                  </div>
                </>
              ) : (
                <div className="bulk-upload-file" data-cy="bulk-upload-file">
                  <div className="bulk-upload-file-icon">
                    <IconFileTypeCsv size={20} />
                  </div>
                  <div className="bulk-upload-file-details">
                    <span className="tj-text-sm font-weight-500 text-truncate" data-cy="uploaded-file-name">
                      {file.name}
                    </span>
                    {status === 'validating' && (
                      <span className="tj-text-xsm bulk-upload-muted d-flex align-items-center gap-1">
                        <Spinner animation="border" size="sm" /> Checking file…
                      </span>
                    )}
                    {status === 'invalid' && (
                      <span
                        className="tj-text-xsm bulk-upload-error d-flex align-items-center gap-1"
                        data-cy="invalid-file-message"
                      >
                        <IconAlertTriangleFilled size={14} /> Errors detected, resolve and re-upload
                      </span>
                    )}
                    {status === 'valid' && (
                      <span
                        className="tj-text-xsm bulk-upload-success d-flex align-items-center gap-1"
                        data-cy="valid-file-success"
                      >
                        <IconCircleCheckFilled size={14} /> {describeSummary(summary)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="bulk-upload-icon-btn"
                    onClick={open}
                    aria-label="Replace file"
                    data-cy="button-replace-file"
                  >
                    <IconRefresh size={16} />
                  </button>
                  <button
                    type="button"
                    className="bulk-upload-icon-btn"
                    onClick={removeFile}
                    aria-label="Remove file"
                    data-cy="button-remove-file"
                  >
                    <IconX size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {status === 'invalid' && errors.length > 0 && (
            <section className="bulk-upload-errors" data-cy="bulk-upload-errors">
              <p className="tj-text-sm font-weight-500 bulk-upload-error mb-2">Errors ({errors.length})</p>
              <ul className="tj-text-xsm">
                {errors.map((message, index) => (
                  <li key={index} data-cy="bulk-upload-error-message">
                    {message}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="manage-users-drawer-footer bulk-upload-drawer-footer">
          <ButtonSolid
            as="a"
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            variant="ghostBlue"
            leftIcon="IconBook"
            isTablerIcon
            iconWidth="16"
            data-cy="button-read-docs"
          >
            Read docs
          </ButtonSolid>
          <div className="d-flex gap-2">
            <ButtonSolid variant="tertiary" onClick={close} data-cy="cancel-button">
              Cancel
            </ButtonSolid>
            <ButtonSolid
              variant="primary"
              leftIcon="fileupload"
              fill="#FDFDFE"
              iconWidth="16"
              onClick={upload}
              disabled={status !== 'valid' || uploading}
              isLoading={uploading}
              data-cy="button-upload-users"
            >
              Upload users
            </ButtonSolid>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
