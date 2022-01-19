import React, { useState } from 'react';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';

export const ReleaseVersionButton = function DeployVersionButton({
  appId,
  appName,
  editingVersion,
  isVersionReleased,
  fetchApp,
  onVersionRelease,
}) {
  const [isReleasing, setIsReleasing] = useState(false);

  const releaseVersion = (editingVersion) => {
    setIsReleasing(true);
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
        className={'btn btn-primary btn-sm ' + (isVersionReleased ? 'disabled' : '')}
        onClick={() => releaseVersion(editingVersion)}
      >
        {isReleasing && <span className="spinner-border spinner-border-sm mx-2" role="status"></span>}
        Release
      </button>
    </div>
  );
};
