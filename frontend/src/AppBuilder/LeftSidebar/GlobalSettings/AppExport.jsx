import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import ExportAppModal from '@/HomePage/ExportAppModal';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';

const AppExport = ({ darkMode }) => {
  const moduleId = useModuleId();
  const { app } = useStore(
    (state) => ({
      app: state.appStore.modules[moduleId].app,
    }),
    shallow
  );

  const [isExportingApp, setIsExportingApp] = React.useState(false);

  return (
    <>
      {isExportingApp && app.hasOwnProperty('appId') && (
        <ExportAppModal
          show={isExportingApp}
          closeModal={() => {
            setIsExportingApp(false);
          }}
          customClassName="modal-version-lists"
          title={'Select a version to export'}
          app={app}
          darkMode={darkMode}
        />
      )}
      <div className="d-flex align-items-center  global-popover-div-wrap mb-3">
        <p className="tj-text-xsm color-slate12 w-full m-auto">Export app</p>
        <div>
          <Button
            fill="var(--indigo9)"
            leadingIcon="fileupload"
            className="tw-w-[158px] !tw-text-[var(--indigo9)] !tw-bg-[var(--indigo3)] hover:!tw-text-[var(--indigo10)] hover:!tw-bg-[var(--indigo4)] active:!tw-text-[var(--indigo9)] active:!tw-bg-[var(--indigo5) focus-visible:!tw-text-[var(--indigo10)] focus-visible:!tw-bg-[var(--indigo3)]"
            onClick={() => {
              setIsExportingApp(true);
              document.getElementById('maintenance-app-modal').click();
            }}
            data-cy="button-user-status-change"
          >
            Export this app
          </Button>
        </div>
      </div>
      {/* {isExportingApp && <ExportAppModal app={app} setIsExportingApp={toggleExportingApp} darkMode={darkMode} />} */}
    </>
  );
};

export default AppExport;
