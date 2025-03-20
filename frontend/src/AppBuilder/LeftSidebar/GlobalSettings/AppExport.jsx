import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import ExportAppModal from '@/HomePage/ExportAppModal';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import cx from 'classnames';

const AppExport = ({ darkMode }) => {
  const { app } = useStore(
    (state) => ({
      app: state.app,
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
      <div className={cx({ 'dark-theme': darkMode })}>
        <Button
          fill="rgb(172, 178, 185)"
          leadingIcon="fileupload"
          variant="tertiary"
          className={cx('app-export-btn')}
          onClick={() => {
            setIsExportingApp(true);
            document.getElementById('maintenance-app-modal').click();
          }}
          data-cy="button-user-status-change"
        >
          Export app
        </Button>
      </div>
      {/* {isExportingApp && <ExportAppModal app={app} setIsExportingApp={toggleExportingApp} darkMode={darkMode} />} */}
    </>
  );
};

export default AppExport;
