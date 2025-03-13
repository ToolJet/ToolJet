import React, { useEffect } from 'react';
import { AppModal } from '@/_components';

const BaseAppActionModal = ({ configs, modalStates, ...props }) => {
  const getActiveConfig = () => {
    switch (true) {
      case modalStates.showCreateAppModal || modalStates.showCreateModuleModal:
        return configs.create;
      case modalStates.showCloneAppModal:
        return configs.clone;
      case modalStates.showImportAppModal:
        return configs.import;
      case modalStates.showCreateAppFromTemplateModal:
        return configs.template;
      default:
        return null;
    }
  };

  const activeConfig = getActiveConfig();
  if (!activeConfig) return null;

  return <AppModal {...activeConfig} {...props} />;
};

export default BaseAppActionModal;
