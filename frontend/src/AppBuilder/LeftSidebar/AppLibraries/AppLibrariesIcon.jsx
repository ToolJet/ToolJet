import { AppLibrariesIcon as EEAppLibrariesIcon } from '@ee/modules/AppLibraries/components/AppLibrariesIcon';
const AppLibrariesIcon = () => {
  return null;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppLibrariesIcon : EEAppLibrariesIcon;
