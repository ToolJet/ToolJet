import './_styles/app-history.scss';
import { AppHistoryPanel as EEAppHistoryPanel } from '@ee/modules/AppHistory/components/AppHistoryPanel';

const AppHistoryPanel = () => {
  return null;
};
export default process.env.TOOLJET_EDITION === 'ce' ? AppHistoryPanel : EEAppHistoryPanel;
