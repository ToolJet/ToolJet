import { User } from '@entities/user.entity';

export interface IWorkflowService {
  getWorkflows(organizationId: string, user: User): Promise<{ id: string; name: string }[]>;
}
