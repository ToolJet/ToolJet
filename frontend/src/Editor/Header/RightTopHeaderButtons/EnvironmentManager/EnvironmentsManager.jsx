import { useEnvironmentsAndVersionsStore } from '@/_stores/environmentsAndVersionsStore';
import React, { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useAppVersionStore } from '@/_stores/appVersionStore';

const EnvironmentManager = () => {
  const { editingVersionId } = useAppVersionStore(
    (state) => ({
      editingVersionId: state?.editingVersion?.id,
    }),
    shallow
  );
  const { init, setEnvironmentDropdownStatus, initializedEnvironmentDropdown } = useEnvironmentsAndVersionsStore(
    (state) => ({
      initializedEnvironmentDropdown: state.initializedEnvironmentDropdown,
      init: state.actions.init,
      setEnvironmentDropdownStatus: state.actions.setEnvironmentDropdownStatus,
    }),
    shallow
  );
  useEffect(() => {
    !initializedEnvironmentDropdown && initComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initComponent = async () => {
    await init(editingVersionId);
    setEnvironmentDropdownStatus(true);
  };

  return <></>;
};

export default EnvironmentManager;
