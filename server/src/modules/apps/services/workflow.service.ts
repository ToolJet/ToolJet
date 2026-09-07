import { Injectable } from '@nestjs/common';
import { AppsRepository } from '../repository';
import { IWorkflowService } from '../interfaces/services/IWorkflowService';
import { User } from '@entities/user.entity';
@Injectable()
export class WorkflowService implements IWorkflowService {
  constructor(protected readonly appsRepository: AppsRepository) {}

  // CE has no workflow/workflow-folder granular permission model - listing stays org-wide.
  // EE overrides this to scope the list to the user's editable/executable workflows.
  async getWorkflows(organizationId: string, _user: User) {
    return await this.appsRepository.findAllOrganizationWorkflows(organizationId);
  }
}
