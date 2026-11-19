import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';
import ExportAppDialog from '@/pages/components/ExportAppDialog';
import { shallow } from 'zustand/shallow';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import cx from 'classnames';

const AppExport = ({ darkMode, isModuleEditor = false }) => {
  const { moduleId } = useModuleContext();
  const { app } = useStore(
    (state) => ({
      app: state.appStore.modules[moduleId].app,
    }),
    shallow
  );

  const [isExportAppDialogOpen, setIsExportAppDialogOpen] = useState(false);

  return (
    <>
      {isExportAppDialogOpen && app.hasOwnProperty('appId') && (
        <ExportAppDialog
          appDetails={app}
          open={isExportAppDialogOpen}
          onClose={() => setIsExportAppDialogOpen(false)}
        />
      )}

      <div className={cx({ 'dark-theme': darkMode })}>
        <Button
          fill="rgb(172, 178, 185)"
          leadingIcon="fileupload"
          variant="tertiary"
          className={cx('app-export-btn')}
          onClick={() => {
            setIsExportAppDialogOpen(true);
            document.getElementById('maintenance-app-modal').click();
          }}
          data-cy="export-app-button"
        >
          {isModuleEditor ? 'Export module' : 'Export app'}
        </Button>
      </div>
    </>
  );
};

export default AppExport;
