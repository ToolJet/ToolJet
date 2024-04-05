import React, { useState } from 'react';
import cx from 'classnames';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { ConfirmDialog } from '@/_components/ConfirmDialog';
import { shallow } from 'zustand/shallow';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const ReleaseVersionButton = function DeployVersionButton({ onVersionRelease }) {
  const [isReleasing, setIsReleasing] = useState(false);
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
    }),
    shallow
  );
  const [showPageDeletionConfirmation, setShowPageDeletionConfirmation] = useState(false);

  const { t } = useTranslation();
  const releaseVersion = (editingVersion) => {
    setShowPageDeletionConfirmation(false);
    setIsReleasing(true);

    const { id: versionToBeReleased, name, app_id } = editingVersion;

    appsService
      .releaseVersion(app_id, versionToBeReleased)
      .then(() => {
        toast(`Version ${name} released`, {
          icon: '🚀',
        });
        onVersionRelease(versionToBeReleased);
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
        <ButtonSolid
          data-cy={`button-release`}
          className={cx('release-button', {
            'btn-loading': isReleasing,
          })}
          disabled={isVersionReleased}
          onClick={() => setShowPageDeletionConfirmation(true)}
        >
          {isVersionReleased ? 'Released' : <>{t('editor.release', 'Release')}</>}
        </ButtonSolid>
      </div>
    </>
  );
};
