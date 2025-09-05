import React, { useState } from 'react';
import cx from 'classnames';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReleaseConfirmation from '@/Editor/ReleaseConfirmation';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import '@/_styles/versions.scss';
import { Button } from '@/components/ui/Button/Button';
import { Earth } from 'lucide-react';

export const ReleaseVersionButton = function DeployVersionButton({ onVersionRelease }) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isVersionReleased, editingVersion, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );

  const { t } = useTranslation();

  const releaseVersion = (editingVersion) => {
    setIsReleasing(true);
    const { id: versionToBeReleased, name, app_id, appId } = editingVersion;
    appsService
      .releaseVersion(app_id || appId, versionToBeReleased)
      .then(() => {
        toast(`Version ${name} released`, {
          icon: '🚀',
        });
        onVersionRelease(versionToBeReleased);
        setIsReleasing(false);
        setShowConfirmation(false);
      })
      .catch((_error) => {
        toast.error(`${name} could not be released. Please try again!`);
        setIsReleasing(false);
      });
  };

  const onReleaseButtonClick = () => {
    setShowConfirmation(true);
  };

  const onReleaseConfirm = () => {
    releaseVersion(editingVersion);
  };

  return (
    <>
      <ReleaseConfirmation
        show={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={onReleaseConfirm}
      />
      <div>
        <Button
          variant="secondary"
          data-cy={`button-release`}
          className={cx('release-button', {
            'btn-loading': isReleasing,
            'released-button': isVersionReleased,
          })}
          disabled={isVersionReleased}
          onClick={onReleaseButtonClick}
        >
          <Earth width="16" height="16" className="tw-text-icon-accent" />
          {isVersionReleased ? 'Released' : <>{t('editor.release', 'Release')}</>}
        </Button>
      </div>
    </>
  );
};
