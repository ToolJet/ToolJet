import React from 'react';
import EECreateModuleWithPrompt from '@ee/modules/AiBuilder/components/CreateModuleWithPrompt';

const CreateModuleWithPrompt = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? CreateModuleWithPrompt : EECreateModuleWithPrompt;
