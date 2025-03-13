import React, { useState } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import { shallow } from 'zustand/shallow';
import { useAppInfo } from '@/_stores/appDataStore';
import { ToolTip } from '@/_components/ToolTip';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import PromoteConfirmationModal from './PromoteConfirmationModal';

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
      <ButtonSolid
        variant="primary"
        onClick={handlePromote}
        size="md"
        disabled={shouldDisablePromote}
        data-cy="promote-button"
      >
        {' '}
        <ToolTip message="Promote this version to the next environment" placement="bottom" show={!shouldDisablePromote}>
          <div style={{ fontSize: '14px' }}>Promote </div>
        </ToolTip>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.276332 7.02113C0.103827 7.23676 0.138788 7.55141 0.354419 7.72391C0.57005 7.89642 0.884696 7.86146 1.0572 7.64583L3.72387 4.31249C3.86996 4.12988 3.86996 3.87041 3.72387 3.6878L1.0572 0.354464C0.884696 0.138833 0.57005 0.103872 0.354419 0.276377C0.138788 0.448881 0.103827 0.763528 0.276332 0.979158L2.69312 4.00014L0.276332 7.02113ZM4.27633 7.02113C4.10383 7.23676 4.13879 7.55141 4.35442 7.72391C4.57005 7.89642 4.8847 7.86146 5.0572 7.64583L7.72387 4.31249C7.86996 4.12988 7.86996 3.87041 7.72387 3.6878L5.0572 0.354463C4.8847 0.138832 4.57005 0.103871 4.35442 0.276377C4.13879 0.448881 4.10383 0.763527 4.27633 0.979158L6.69312 4.00014L4.27633 7.02113Z"
            fill={shouldDisablePromote ? '#C1C8CD' : '#FDFDFE'}
          />
        </svg>
      </ButtonSolid>

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
