import { User } from '@entities/user.entity';
import { AppCreateDto } from '@modules/apps/dto';
import { WorkflowConsumersResponseDto } from '@modules/workflows/dto/workflow-consumers-response.dto';

import {
  ResolveWorkflowVersionDto,
  ResolvedWorkflowVersion,
} from '@modules/workflows/dto/resolve-workflow-version.dto';

export interface IWorkflowsController {
  resolveVersion(user: User, id: string, query: ResolveWorkflowVersionDto): Promise<ResolvedWorkflowVersion>;
  create(user: User, appCreateDto: AppCreateDto): Promise<any>;
  consumers(user: User, id: string): Promise<WorkflowConsumersResponseDto>;
}
