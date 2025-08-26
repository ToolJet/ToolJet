import React, { useState } from 'react';
import cx from 'classnames';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReleaseConfirmation from '@/AppBuilder/Header/ReleaseConfirmation';
import { shallow } from 'zustand/shallow';
import '@/_styles/versions.scss';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import { ToolTip } from '@/_components/ToolTip';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';

const ReleaseVersionButton = function DeployVersionButton() {
  const { moduleId } = useModuleContext();
  const [isReleasing, setIsReleasing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const getCanPromoteAndRelease = useStore((state) => state.getCanPromoteAndRelease);
  const { isReleaseVersionEnabled } = getCanPromoteAndRelease();
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
        <ToolTip
          message="You don't have access to release application. Contact admin to know more."
          placement="bottom"
          show={!isReleaseVersionEnabled}
        >
          <Button
            variant="secondary"
            data-cy={`button-release`}
            className={cx('tw-text-text-default',{
              'released-button': isVersionReleased,
            })}
            isLoading={isReleasing}
            disabled={isVersionReleased}
            onClick={onReleaseButtonClick}
          >
            <Globe width="16" height="16" className="tw-text-icon-accent" />
            {isVersionReleased ? 'Released' : <>{t('editor.release', 'Release')}</>}
          </Button>
        </ToolTip>
      </div>
    </>
  );
};

export default ReleaseVersionButton;
