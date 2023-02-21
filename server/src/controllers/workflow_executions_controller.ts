import { CreateWorkflowExecutionDto } from '@dto/create-workflow-execution.dto';
import { Body, Controller, Post } from '@nestjs/common';
import { WorkflowExecutionsService } from '@services/workflow_executions.service';
import { decamelizeKeys } from 'humps';

@Controller('workflow_executions')
export class WorkflowExecutionsController {
  constructor(private workflowExecutionsService: WorkflowExecutionsService) {}

  @Post()
  async create(@Body() createWorkflowExecutionDto: CreateWorkflowExecutionDto) {
    return decamelizeKeys(await this.workflowExecutionsService.create(createWorkflowExecutionDto));
  }
}
