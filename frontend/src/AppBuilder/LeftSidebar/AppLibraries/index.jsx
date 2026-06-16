import { AppLibraries as EEAppLibraries } from '@ee/modules/AppLibraries/components/AppLibraries';
const AppLibraries = () => {
  return null;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppLibraries : EEAppLibraries;
