import { useEnvironmentsAndVersionsActions } from '@/_stores/environmentsAndVersionsStore';
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
  const { init, setEnvironmentDropdownStatus } = useEnvironmentsAndVersionsActions();
  useEffect(() => {
    initComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initComponent = async () => {
    await init(editingVersionId);
    setEnvironmentDropdownStatus(true);
  };

  return <div></div>;
};

export default EnvironmentManager;
