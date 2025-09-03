import { WorkflowBundle } from '@entities/workflow_bundle.entity';

export interface BundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string>;
  bundleSha?: string;
}

export interface IBundleGenerationService {
  updatePackages(appVersionId: string, dependencies: Record<string, string>): Promise<WorkflowBundle>;
  generateBundle(appVersionId: string, dependencies: Record<string, string>): Promise<WorkflowBundle>;
  getBundleForExecution(appVersionId: string): Promise<string | null>;
  getCurrentDependencies(appVersionId: string): Promise<Record<string, string>>;
  getBundleStatus(appVersionId: string): Promise<BundleStatus>;
  rebuildBundle(appVersionId: string): Promise<WorkflowBundle>;
}