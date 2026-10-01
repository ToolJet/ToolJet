import { Injectable } from '@nestjs/common';
import { IWorkflowApprovalsService } from '../interfaces/IWorkflowApprovalsService';
import { ApprovalListItem, ApprovalTokenView } from '../types/approval-list';

@Injectable()
export class WorkflowApprovalsService implements IWorkflowApprovalsService {
  async getByToken(): Promise<ApprovalTokenView> {
    throw new Error('Method not implemented.');
  }
  async resolve(): Promise<{ status: 'resolved' }> {
    throw new Error('Method not implemented.');
  }
  async resolveById(): Promise<{ status: 'resolved' }> {
    throw new Error('Method not implemented.');
  }
  async cancel(): Promise<{ status: 'cancelled' }> {
    throw new Error('Method not implemented.');
  }
  async list(): Promise<{
    requests: ApprovalListItem[];
    meta: { page: number; perPage: number; total: number };
  }> {
    throw new Error('Method not implemented.');
  }
}
