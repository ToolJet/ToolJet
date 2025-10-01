export interface IBundleGenerationService {
  updatePackages(workflowId: string, dependencies: Record<string, string>): Promise<void>;
  generateBundle(workflowId: string, dependencies: Record<string, string>): Promise<void>;
  getBundleForExecution(workflowId: string): Promise<string | null>;
  getCurrentDependencies(workflowId: string): Promise<Record<string, string>>;
  getBundleStatus(workflowId: string): Promise<BundleStatus>;
  rebuildBundle(workflowId: string): Promise<void>;
}

export interface BundleStatus {
  status: 'none' | 'building' | 'ready' | 'failed';
  sizeBytes?: number;
  generationTimeMs?: number;
  error?: string;
  dependencies?: Record<string, string>;
  bundleSha?: string;
}
