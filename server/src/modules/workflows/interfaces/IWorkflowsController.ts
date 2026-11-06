import { User } from '@entities/user.entity';
import { AppCreateDto } from '@modules/apps/dto';
import { WorkflowConsumersResponseDto } from '@modules/workflows/dto/workflow-consumers-response.dto';

export interface IWorkflowsController {
  create(user: User, appCreateDto: AppCreateDto): Promise<any>;
  consumers(user: User, id: string): Promise<WorkflowConsumersResponseDto>;
}
