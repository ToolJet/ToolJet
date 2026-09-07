import { App as AppEntity } from '@entities/app.entity';
import { User as UserEntity } from '@entities/user.entity';

export interface IWorkflowController {
  fetchWorkflows(app: AppEntity, user: UserEntity): Promise<object>;
}
