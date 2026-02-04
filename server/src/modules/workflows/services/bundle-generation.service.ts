import { Injectable } from '@nestjs/common';
import { IBundleGenerationService, BundleStatus } from '../interfaces/IBundleGenerationService';

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

  async getBundleStatus(workflowId: string): Promise<BundleStatus> {
    return { status: 'none' };
  }

  async rebuildBundle(workflowId: string): Promise<void> {
    throw new Error('Package bundling is not available in Community Edition');
  }
}
