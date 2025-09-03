import { Injectable } from '@nestjs/common';
import { IBundleGenerationService, BundleStatus } from '../interfaces/IBundleGenerationService';
import { WorkflowBundle } from '@entities/workflow_bundle.entity';

@Injectable()
export class BundleGenerationService implements IBundleGenerationService {
  async updatePackages(appVersionId: string, dependencies: Record<string, string>): Promise<WorkflowBundle> {
    throw new Error('NPM package management not available in Community Edition');
  }

  async generateBundle(appVersionId: string, dependencies: Record<string, string>): Promise<WorkflowBundle> {
    throw new Error('Bundle generation not available in Community Edition');
  }

  async getBundleForExecution(appVersionId: string): Promise<string | null> {
    return null;
  }

  async getCurrentDependencies(appVersionId: string): Promise<Record<string, string>> {
    return {};
  }

  async getBundleStatus(appVersionId: string): Promise<BundleStatus> {
    return {
      status: 'none',
      dependencies: {}
    };
  }

  async rebuildBundle(appVersionId: string): Promise<WorkflowBundle> {
    throw new Error('Bundle rebuild not available in Community Edition');
  }
}