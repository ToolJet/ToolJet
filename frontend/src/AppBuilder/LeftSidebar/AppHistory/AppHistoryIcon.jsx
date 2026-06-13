import { AppHistoryIcon as EEAppHistoryIcon } from '@ee/modules/AppHistory/components/AppHistoryIcon';
const AppHistoryIcon = () => {
  return null;
};

export default process.env.TOOLJET_EDITION === 'ce' ? AppHistoryIcon : EEAppHistoryIcon;
