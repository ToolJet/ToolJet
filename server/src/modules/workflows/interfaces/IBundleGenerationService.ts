export interface IBundleGenerationService {
  updatePackages(workflowId: string, dependencies: Record<string, string> | string): Promise<void>;
  generateBundle(workflowId: string, dependencies: Record<string, string> | string): Promise<void>;
  getBundleForExecution(workflowId: string): Promise<string | null>;
  getCurrentDependencies(workflowId: string): Promise<Record<string, string> | string>;
  getBundleStatus(workflowId: string): Promise<IBundleStatus>;
  rebuildBundle(workflowId: string): Promise<void>;
}

export interface IBundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string> | string;
  bundleSha?: string;
}
