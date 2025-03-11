import { App as AppEntity } from '@entities/app.entity';

export interface IWorkflowController {
  fetchWorkflows(app: AppEntity): Promise<object>;
}
