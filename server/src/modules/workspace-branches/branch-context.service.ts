import { Injectable } from '@nestjs/common';
import { IBranchContextService } from './interfaces/IBranchContextService';

@Injectable()
export class BranchContextService implements IBranchContextService {
  // CE: no branching — always returns null (feature gated)
  async getActiveBranchId(organizationId: string): Promise<string | null> {
    return null;
  }

  async getDefaultBranchId(organizationId: string): Promise<string | null> {
    return null;
  }
}
