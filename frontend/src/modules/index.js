/* Common styles */
import './common/resources/styles/common.styles.scss';
/* Modules */
import Appbuilder from './Appbuilder';
import AiBuilder from './AiBuilder';
import getAuditLogsRoutes from './auditLogs';
import auth from './auth';
import Dashboard from './dashboard';
import getDataSourcesRoutes from './dataSources/index';
import InstanceSettings from './InstanceSettings';
import onboarding from './onboarding';
import Settings from './Settings';
import Workflows from './workflows';
import WorkspaceSettings from './WorkspaceSettings';
import RenderWorkflow from './RenderWorkflow';
import Modules from './Modules';

export {
  onboarding,
  auth,
  WorkspaceSettings,
  InstanceSettings,
  Settings,
  Dashboard,
  Workflows,
  getDataSourcesRoutes,
  Appbuilder,
  getAuditLogsRoutes,
  RenderWorkflow,
  AiBuilder,
  Modules,
};
