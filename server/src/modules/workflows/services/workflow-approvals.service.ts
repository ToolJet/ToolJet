import { Injectable } from '@nestjs/common';
import { IWorkflowApprovalsService } from '../interfaces/IWorkflowApprovalsService';

@Injectable()
export class WorkflowApprovalsService implements IWorkflowApprovalsService {
  async getByToken(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async resolve(): Promise<{ status: 'resolved' }> {
    throw new Error('Method not implemented.');
  }
  async cancel(): Promise<{ status: 'cancelled' }> {
    throw new Error('Method not implemented.');
  }
}
