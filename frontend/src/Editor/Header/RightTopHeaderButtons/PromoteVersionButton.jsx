import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import { shallow } from 'zustand/shallow';
import { useAppInfo } from '@/_stores/appDataStore';
import { ToolTip } from '@/_components/ToolTip';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import PromoteConfirmationModal from './PromoteConfirmationModal';
import { ArrowBigUp } from 'lucide-react';

const PromoteVersionButton = ({ appEnvironmentChanged }) => {
  const { appVersionEnvironment, environments, selectedEnvironment } = useEnvironmentsAndVersionsStore(
    (state) => ({
      selectedEnvironment: state.selectedEnvironment,
      environments: state.environments,
      appVersionEnvironment: state.appVersionEnvironment,
    }),
    shallow
  );
  const [promoteModalData, setPromoteModalData] = useState(null);
  const { isSaving } = useAppInfo();
  const { editingVersion } = useAppVersionStore(
    (state) => ({
      editingVersion: state.editingVersion,
    }),
    shallow
  );
  const shouldDisablePromote = isSaving || selectedEnvironment.priority < appVersionEnvironment.priority;

  const handlePromote = () => {
    const curentEnvIndex = environments.findIndex((env) => env.id === appVersionEnvironment.id);
    setPromoteModalData({
      current: appVersionEnvironment,
      target: environments[curentEnvIndex + 1],
    });
  };

  return (
    <>
      <ToolTip message="Promote this version to the next environment" placement="bottom" show={!shouldDisablePromote}>
        <Button variant="secondary" onClick={handlePromote} disabled={shouldDisablePromote} data-cy="promote-button">
          <ArrowBigUp width="16" height="16" className="tw-text-icon-accent" />
          <div style={{ fontSize: '14px' }}>Promote </div>
        </Button>
      </ToolTip>

      <PromoteConfirmationModal
        data={promoteModalData}
        editingVersion={editingVersion}
        onClose={() => setPromoteModalData(null)}
        appEnvironmentChanged={appEnvironmentChanged}
        fetchEnvironments={() => {}}
      />
    </>
  );
};

export default PromoteVersionButton;
