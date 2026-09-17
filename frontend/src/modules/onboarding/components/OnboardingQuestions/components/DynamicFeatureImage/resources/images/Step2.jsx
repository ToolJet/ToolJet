import React from 'react';
import workspaceSetupImage from './light-mode/step2.svg?url';
import workspaceSetupImageDark from './dark-mode/step2.svg?url';

const Step2 = ({ darkMode }) => {
  const imgSrc = darkMode ? workspaceSetupImageDark : workspaceSetupImage;

  return <img src={imgSrc} alt="Workspace setup" />;
};

export default Step2;
