import React, { useState } from 'react';
import { ToolTip } from '@/_components';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { AppModal } from '@/_components/AppModal';
import { PenLine } from 'lucide-react';

function EditAppName() {
  const { moduleId } = useModuleContext();
  const [appId, appName, setAppName, appCreationMode] = useStore(
    (state) => [
      state.appStore.modules[moduleId].app.appId,
      state.appStore.modules[moduleId].app.appName,
      state.setAppName,
      state.appStore.modules[moduleId].app.creationMode,
    ],
    shallow
  );

  const [showRenameModal, setShowRenameModal] = useState(false);

  const handleRenameApp = async (newAppName, appId) => {
    const sanitizedName = newAppName?.trim().replace(/\s+/g, ' ');

    // Prevent unnecessary API call if the name effectively hasn't changed
    if (sanitizedName === appName) {
      setShowRenameModal(false);
      return true;
    }
    try {
      await appsService.saveApp(appId, { name: sanitizedName });
      setAppName(sanitizedName);
      toast.success('App name has been updated!');
      return true;
    } catch (errorResponse) {
      if (errorResponse.statusCode === 409) {
        return false;
      }
      if (errorResponse.statusCode !== 451) {
        throw errorResponse;
      }
    }
  };

  return (
    <>
      <div className="tw-h-full tw-flex tw-items-start tw-justify-start">
        <ToolTip message={appName} placement="bottom" isVisible={appCreationMode !== 'GIT'}>
          <button
            className="edit-app-name-button tw-h-8 tw-min-w-[100px] tw-rounded-lg tw-pr-1 tw-w-auto tw-font-medium tw-cursor-pointer tw-outline-none tw-bg-transparent tw-border tw-border-transparent hover:tw-border-border-strong tw-shadow-none tw-group tw-transition-all tw-duration-300 tw-flex tw-items-center tw-relative tw-justify-start"
            type="button"
            data-cy="edit-app-name-button"
            onClick={() => setShowRenameModal(true)}
          >
            <span
              className="tw-font-title-large tw-truncate tw-w-full tw-block tw-text-start group-hover:tw-w-[calc(100%-24px)] tw-text-[var(--slate12)]"
              data-cy="editor-app-name-input"
            >
              {appName}
            </span>
            <span className="tw-absolute tw-right-0.5 tw-top-1 tw-text-icon-default tw-hidden group-hover:tw-block tw-w-7 tw-h-7 tw-items-center tw-justify-center">
              <PenLine width="16" height="16" name="pencil" />
            </span>
          </button>
        </ToolTip>
      </div>

      {showRenameModal && (
        <AppModal
          show={showRenameModal}
          closeModal={() => setShowRenameModal(false)}
          processApp={handleRenameApp}
          selectedAppId={appId}
          selectedAppName={appName}
          title="Rename app"
          actionButton="Rename app"
          actionLoadingButton={'Renaming'}
          appType="app"
        />
      )}
    </>
  );
}

export default EditAppName;
