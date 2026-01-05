import { Injectable } from '@nestjs/common';
import { IBundleGenerationService, IBundleStatus } from '../interfaces/IBundleGenerationService';

@Injectable()
export class BundleGenerationService implements IBundleGenerationService {
  async updatePackages(workflowId: string, dependencies: Record<string, string>): Promise<void> {
    throw new Error('Package bundling is not available in Community Edition');
  }

  async generateBundle(workflowId: string, dependencies: Record<string, string>): Promise<void> {
    throw new Error('Package bundling is not available in Community Edition');
  }

  async getBundleForExecution(workflowId: string): Promise<string | null> {
    return null; // CE workflows have no bundles
  }

  async getCurrentDependencies(workflowId: string): Promise<Record<string, string>> {
    return {};
  }

  async getBundleStatus(workflowId: string): Promise<IBundleStatus> {
    return { status: 'none' };
  }

  async rebuildBundle(workflowId: string): Promise<void> {
    throw new Error('Package bundling is not available in Community Edition');
  }
}
