import React, { useState } from 'react';
import cx from 'classnames';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReleaseConfirmation from './ReleaseConfirmation';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
// eslint-disable-next-line import/no-named-as-default
import posthog from 'posthog-js';
import '@/_styles/versions.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const ReleaseVersionButton = function DeployVersionButton({ appId, appName, fetchApp, onVersionRelease }) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { isVersionReleased, editingVersion } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      editingVersion: state.editingVersion,
    }),
    shallow
  );

  const { t } = useTranslation();

  const releaseVersion = (editingVersion) => {
    setIsReleasing(true);
    posthog.capture('click_release', { appId }); //posthog event
    appsService
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
        setShowConfirmation(false);
      })
      .catch((_error) => {
        toast.error('Oops, something went wrong');
        setIsReleasing(false);
      })
      .finally(() => {
        useAppVersionStore.getState().actions.updateReleasedVersionId(editingVersion.id);
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
