import React, { useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import SwitchComponent from '@/components/ui/Switch/Index';
import { shallow } from 'zustand/shallow';
import { Confirm } from '@/Editor/Viewer/Confirm';

const MaintenanceMode = ({ darkMode }) => {
  const [showConfirmation, setConfirmationShow] = useState(false);
  const { isMaintenanceOn, toggleAppMaintenance } = useStore(
    (state) => ({
      isMaintenanceOn: state.app.isMaintenanceOn,
      toggleAppMaintenance: state.toggleAppMaintenance,
    }),
    shallow
  );

  return (
    <>
      <Confirm
        show={showConfirmation}
        message={
          isMaintenanceOn
            ? 'Users will now be able to launch the released version of this app, do you wish to continue?'
            : 'Users will not be able to launch the app until maintenance mode is turned off, do you wish to continue?'
        }
        onConfirm={() => toggleAppMaintenance()}
        onCancel={() => setConfirmationShow(false)}
        darkMode={darkMode}
      />
      <div className="tw-flex tw-mb-3">
        <SwitchComponent
          align="right"
          label="Maintenance mode"
          size="default"
          checked={isMaintenanceOn}
          onCheckedChange={() => setConfirmationShow(true)}
          data-cy={`toggle-maintenance-mode`}
          className="tw-w-full"
        />
      </div>
    </>
  );
};

export default MaintenanceMode;
