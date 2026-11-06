import { useVersionLifecycle } from '@/AppBuilder/Header/VersionManager/VersionLifecycleContext';
import { withAppVersionLifecycle } from '@/AppBuilder/Header/VersionManager/AppVersionLifecycleProvider';
import React, { useState } from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ReleaseConfirmation from '@/AppBuilder/Header/ReleaseConfirmation';
import '@/_styles/versions.scss';

import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { ToolTip } from '@/_components/ToolTip';

const ReleaseVersionButton = function DeployVersionButton({ version = null, variant = 'default', darkMode = false }) {
  const { versions, selectedVersionId, releasedVersionId, capabilities = {}, actions } = useVersionLifecycle();
  const [isReleasing, setIsReleasing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isReleaseVersionEnabled = capabilities.canRelease;
  const versionToBeReleased = version?.id || selectedVersionId;
  const name = version?.name || versions.find((v) => v.id === versionToBeReleased)?.name;
  const isVersionReleased = releasedVersionId === versionToBeReleased;
  const { t } = useTranslation();

  const releaseVersion = () => {
    setIsReleasing(true);
    actions
      .release(versionToBeReleased)
      .then(() => {
        toast(`Version ${name} released`, {
          icon: '🚀',
        });

        setIsReleasing(false);
        setShowConfirmation(false);
      })
      .catch((error) => {
        const rawError = error?.error || error?.message;
        const errorMessage =
          typeof rawError === 'object'
            ? rawError.error
            : rawError || `${name} could not be released. Please try again!`;
        const errorDetails = typeof rawError === 'object' ? rawError.details : errorMessage;
        toast.error(errorMessage);
        setIsReleasing(false);
        setShowConfirmation(false);
        actions.reportError?.('Release Failed', errorMessage, errorDetails || errorMessage);
      });
  };

  const onReleaseButtonClick = (e) => {
    if (e) e.stopPropagation();
    setShowConfirmation(true);
  };

  const onReleaseConfirm = () => {
    releaseVersion();
  };

  // Inline variant for dropdown
  if (variant === 'inline') {
    return (
      <>
        <ReleaseConfirmation
          show={showConfirmation}
          darkMode={darkMode}
          versionId={versionToBeReleased}
          onClose={() => setShowConfirmation(false)}
          onConfirm={onReleaseConfirm}
        />
        <ToolTip
          message={
            !isReleaseVersionEnabled
              ? "You don't have access to release application. Contact admin to know more."
              : 'Release this version'
          }
          placement="left"
          width="280px"
        >
          <span>
            <button
              className={cx('btn btn-sm version-action-btn', { 'dark-theme theme-dark': darkMode })}
              disabled={isVersionReleased || !isReleaseVersionEnabled || isReleasing}
              onClick={onReleaseButtonClick}
              data-cy="release-version-button"
            >
              {isReleasing ? 'Releasing...' : 'Release'}
            </button>
          </span>
        </ToolTip>
      </>
    );
  }

  // Default variant (header button)
  return (
    <>
      <ReleaseConfirmation
        show={showConfirmation}
        darkMode={darkMode}
        versionId={versionToBeReleased}
        onClose={() => setShowConfirmation(false)}
        onConfirm={onReleaseConfirm}
      />
      <div>
        <ToolTip
          message="You don't have access to release application. Contact admin to know more."
          placement="bottom"
          show={!isReleaseVersionEnabled}
          width="280px"
        >
          <Button
            variant="secondary"
            data-cy={`button-release`}
            className={cx('tw-text-text-default', {
              'released-button': isVersionReleased,
            })}
            isLoading={isReleasing}
            disabled={isVersionReleased || !isReleaseVersionEnabled}
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

export default withAppVersionLifecycle(ReleaseVersionButton);
