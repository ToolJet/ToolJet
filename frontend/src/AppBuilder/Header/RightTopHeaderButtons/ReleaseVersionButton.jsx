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
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const ReleaseVersionButton = function DeployVersionButton() {
  const { moduleId } = useModuleContext();
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
        posthogHelper.captureEvent('click_release', { appId }); //posthog event

        updateReleasedVersionId(versionToBeReleased);

        setIsReleasing(false);
        setShowConfirmation(false);
      })
      .catch((error) => {
        const errorMessage = error?.error || error?.message || 'Oops, something went wrong';
        toast.error(errorMessage);
        useStore.getState().debugger.log({
          logLevel: 'error',
          type: 'Custom Log',
          key: 'Release Failed',
          message: errorMessage,
          error: { message: errorMessage },
          errorTarget: 'Version',
          timestamp: new Date().toISOString(),
        });
        setIsReleasing(false);
        setShowConfirmation(false);
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
