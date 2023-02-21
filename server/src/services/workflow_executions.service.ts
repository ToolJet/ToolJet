import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowExecution } from 'src/entities/workflow_execution.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class WorkflowExecutionsService {
  constructor(
    @InjectRepository(WorkflowExecution)
    private workflowExecutionsRepository: Repository<WorkflowExecution>
  ) {}

  async create(createWorkflowExecutionDto: CreateWorkflowExecutionDto): Promise<WorkflowExecution> {
    const workflowExecution = await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        WorkflowExecution,
        await manager.create(WorkflowExecution, {
          appVersionId: createWorkflowExecutionDto.appVersionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    });

    return workflowExecution;
  }
}
