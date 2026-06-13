import React from 'react';
import EECreateAppWithPrompt from '@ee/modules/AiBuilder/components/CreateAppWithPrompt';

const CreateAppWithPrompt = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? CreateAppWithPrompt : EECreateAppWithPrompt;
