import React, { useState } from 'react';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const releaseVersion = (editingVersion) => {
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
        fetchApp();
        onVersionRelease(editingVersion.id);
        setIsReleasing(false);
      })
      .catch((_error) => {
        toast.error('Oops, something went wrong');
        setIsReleasing(false);
      });
  };

  return (
    <div>
      <button
        className={`btn btn-primary btn-sm ${isVersionReleased ? 'disabled' : ''} ${isReleasing ? 'btn-loading' : ''}`}
        onClick={() => releaseVersion(editingVersion)}
      >
        {t('editor.release', 'Release')}
      </button>
    </div>
  );
};
