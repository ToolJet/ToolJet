import { Injectable } from '@nestjs/common';
import { AppsRepository } from '../repository';
import { IWorkflowService } from '../interfaces/services/IWorkflowService';
@Injectable()
export class WorkflowService implements IWorkflowService {
  constructor(protected readonly appsRepository: AppsRepository) {}

  async getWorkflows(organizationId: string) {
    return await this.appsRepository.findAllOrganizationWorkflows(organizationId);
  }
}
