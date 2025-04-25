import React, { useState } from 'react';
import cx from 'classnames';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReleaseConfirmation from '@/AppBuilder/Header/ReleaseConfirmation';
import { shallow } from 'zustand/shallow';
import '@/_styles/versions.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';

const ReleaseVersionButton = function DeployVersionButton() {
  const moduleId = useModuleId();
  const [isReleasing, setIsReleasing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isVersionReleased, editingVersion, updateReleasedVersionId, appId, versionToBeReleased, name } = useStore(
    (state) => ({
      isVersionReleased: state.releasedVersionId === state.selectedVersion?.id,
      name: state?.selectedVersion?.name,
      editingVersion: state.editingVersion,
      isEditorFreezed: state.isEditorFreezed,
      updateReleasedVersionId: state.updateReleasedVersionId,
      appId: state.appStore.modules[moduleId].app.appId,
      versionToBeReleased: state.currentVersionId,
      // selectedVersionId: state.selectedVersion.id,
    }),
    shallow
  );

  const { t } = useTranslation();

  const releaseVersion = (editingVersion) => {
    setIsReleasing(true);
    appsService
      .releaseVersion(appId, versionToBeReleased)
      .then(() => {
        toast(`Version ${name} released`, {
          icon: '🚀',
        });

        updateReleasedVersionId(versionToBeReleased);

        setIsReleasing(false);
        setShowConfirmation(false);
      })
      .catch((_error) => {
        toast.error('Oops, something went wrong');
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
        <ButtonSolid
          data-cy={`button-release`}
          className={cx('release-button', {
            'btn-loading': isReleasing,
            'released-button': isVersionReleased,
          })}
          disabled={isVersionReleased}
          onClick={onReleaseButtonClick}
        >
          {isVersionReleased ? 'Released' : <>{t('editor.release', 'Release')}</>}
        </ButtonSolid>
      </div>
    </>
  );
};

export default ReleaseVersionButton;
