import { Injectable } from '@nestjs/common';
import { AppsRepository } from '../repository';
import { IWorkflowService } from '../interfaces/services/IWorkflowService';

@Injectable()
export class WorkflowService implements IWorkflowService {
  constructor(protected readonly appsRepository: AppsRepository) {}

  async getWorkflows(organizationId: string) {
    const workflowApps = await this.appsRepository.find({
      where: { type: 'workflow', organizationId },
    });

    const result = workflowApps.map((workflowApp) => ({ id: workflowApp.id, name: workflowApp.name }));

    return result;
  }
}
