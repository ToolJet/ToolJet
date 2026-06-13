import React from 'react';
import EEHomePagePromptSection from '@ee/modules/AiBuilder/components/CreateAppWithPrompt/HomePagePromptSection';

const HomePagePromptSection = () => {
  return <></>;
};

export default process.env.TOOLJET_EDITION === 'ce' ? HomePagePromptSection : EEHomePagePromptSection;
