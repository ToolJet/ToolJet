import React, { useState } from 'react';
import cx from 'classnames';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/_components/ConfirmDialog';

export const ReleaseVersionButton = function DeployVersionButton({
  appId,
  appName,
  editingVersion,
  isVersionReleased,
  fetchApp,
  onVersionRelease,
  saveEditingVersion,
}) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [showPageDeletionConfirmation, setShowPageDeletionConfirmation] = useState(false);

  const { t } = useTranslation();
  const releaseVersion = (editingVersion) => {
    setShowPageDeletionConfirmation(false);
    setIsReleasing(true);
    saveEditingVersion();
    appService
      .saveApp(appId, {
        name: appName,
        current_version_id: editingVersion.id,
      })
      .then(() => {
        toast(`Version ${editingVersion.name} released`, {
          icon: '🚀',
        });
        fetchApp && fetchApp();
        onVersionRelease(editingVersion.id);
        setIsReleasing(false);
      })
      .catch((_error) => {
        toast.error('Oops, something went wrong');
        setIsReleasing(false);
      });
  };

  const cancelRelease = () => {
    setShowPageDeletionConfirmation(false);
    setIsReleasing(false);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <>
      <ConfirmDialog
        show={showPageDeletionConfirmation}
        message={`Are you sure you want to release this version of the app?`}
        onConfirm={() => releaseVersion(editingVersion)}
        onCancel={() => cancelRelease()}
        darkMode={darkMode}
        confirmButtonType="primary"
        confirmButtonText="Release App"
      />
      <div>
        <button
          data-cy={`button-release`}
          className={cx('btn btn-primary btn-sm rounded-2 bg-light-indigo-09', {
            disabled: isVersionReleased,
            'btn-loading': isReleasing,
          })}
          style={{ padding: '6px 16px' }}
          onClick={() => setShowPageDeletionConfirmation(true)}
        >
          {t('editor.release', 'Release')}
          <svg
            className="ms-2"
            width="17"
            height="17"
            viewBox="0 0 17 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.55985 3.74946C8.82019 3.48911 9.2423 3.48911 9.50265 3.74946L13.5027 7.74946C13.763 8.00981 13.763 8.43192 13.5027 8.69227L9.50265 12.6923C9.2423 12.9526 8.82019 12.9526 8.55985 12.6923C8.2995 12.4319 8.2995 12.0098 8.55985 11.7495L11.4218 8.88753H3.69792C3.32973 8.88753 3.03125 8.58906 3.03125 8.22087C3.03125 7.85268 3.32973 7.5542 3.69792 7.5542H11.4218L8.55985 4.69227C8.2995 4.43192 8.2995 4.00981 8.55985 3.74946Z"
              fill="#FDFDFE"
            />
          </svg>
        </button>
      </div>
    </>
  );
};
