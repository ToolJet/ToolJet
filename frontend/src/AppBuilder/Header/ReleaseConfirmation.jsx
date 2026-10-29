import { useVersionLifecycle } from '@/AppBuilder/Header/VersionManager/VersionLifecycleContext';
import { withAppVersionLifecycle } from '@/AppBuilder/Header/VersionManager/AppVersionLifecycleProvider';
import React, { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import '@/_styles/versions.scss';

function ReleaseConfirmation(props) {
  const { onClose, onConfirm, show, appId, versionId } = props;
  const [notices, setNotices] = useState([]);
  const { t } = useTranslation();
  const darkMode = props.darkMode ?? (localStorage.getItem('darkMode') === 'true' || false);
  const {
    versions,
    selectedVersionId,
    releasedVersionId,
    notices: suppliedNotices = [],
    actions,
  } = useVersionLifecycle();
  const name = versions.find((v) => v.id === (versionId || selectedVersionId))?.name;
  const releasedVersionName = versions.find((v) => v.id === releasedVersionId)?.name;
  const loadNotices = React.useRef(actions.loadReleaseNotices);
  loadNotices.current = actions.loadReleaseNotices;
  useEffect(() => {
    setNotices([]);
    if (!show || !loadNotices.current || !versionId) return;
    let cancelled = false;
    loadNotices
      .current(versionId, appId)
      .then((result) => !cancelled && setNotices(result))
      .catch(() => !cancelled && setNotices([]));
    return () => {
      cancelled = true;
    };
  }, [show, appId, versionId]);
  const releaseNotices = actions.loadReleaseNotices
    ? notices
    : Array.isArray(suppliedNotices)
      ? suppliedNotices
      : suppliedNotices.release || [];

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="sm"
      animation={false}
      centered={true}
      contentClassName={`release-confirm-dialogue-modal ${darkMode ? 'dark-theme' : ''}`}
    >
      <Modal.Header>
        <Modal.Title data-cy="modal-title">Release {name}</Modal.Title>
        <svg
          onClick={onClose}
          className="cursor-pointer"
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          data-cy="close-button"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.5996 11.6201C11.8599 11.3597 12.282 11.3597 12.5424 11.6201L16.071 15.1487L19.5996 11.6201C19.8599 11.3597 20.282 11.3597 20.5424 11.6201C20.8027 11.8804 20.8027 12.3025 20.5424 12.5629L17.0138 16.0915L20.5424 19.6201C20.8027 19.8804 20.8027 20.3025 20.5424 20.5629C20.282 20.8232 19.8599 20.8232 19.5996 20.5629L16.071 17.0343L12.5424 20.5629C12.282 20.8232 11.8599 20.8232 11.5996 20.5629C11.3392 20.3025 11.3392 19.8804 11.5996 19.6201L15.1282 16.0915L11.5996 12.5629C11.3392 12.3025 11.3392 11.8804 11.5996 11.6201Z"
            fill="#11181C"
          />
        </svg>
      </Modal.Header>

      <Modal.Body className="env-confirm-dialogue-body" data-cy="confirm-dialogue-box-text">
        <div className="env-change-info">
          {releasedVersionId === null
            ? `Are you sure you want to release version ${name}?`
            : `Releasing version ${name} will override ${releasedVersionName}. Are you sure you want to continue?`}
        </div>
        {releaseNotices.length > 0 && (
          <ul
            className="tw-mt-3 tw-mb-0 tw-p-0 tw-list-none tw-font-body-small tw-text-text-placeholder"
            data-testid="library-release-notices"
          >
            {releaseNotices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        )}
      </Modal.Body>
      <Modal.Footer className="env-modal-footer">
        <ButtonSolid variant="tertiary" onClick={onClose} data-cy="cancel-button">
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>
        <ButtonSolid variant="primary" onClick={onConfirm} data-cy="yes-button">
          Yes
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
}

export default withAppVersionLifecycle(ReleaseConfirmation);
